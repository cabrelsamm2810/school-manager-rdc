import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { parseEleveQrValue } from '@/lib/qr-eleve';
import { verifyEleveQrSignature } from '@/lib/qr-eleve-sign';
import { currentAnneeScolaire } from '@/lib/annee-scolaire';

export const dynamic = 'force-dynamic';

/** Message unique affiché pour tout QR Code invalide, expiré ou inconnu. */
const QR_INVALIDE = 'QR Code élève invalide ou introuvable.';

const ECOLE_SELECT = {
  nom: true,
  dinacope: true,
  province: true,
  provinceEducationnelle: true,
} as const;

/**
 * POST /api/enseignant/scan-eleve
 *
 * Identifie un élève à partir du QR Code de sa carte scolaire.
 *
 * 1. Le QR est analysé (`lib/qr-eleve.ts`) : seul le matricule y figure, jamais
 *    de données personnelles. Un QR signé par School Manager RDC doit passer la
 *    vérification HMAC (`lib/qr-eleve-sign.ts`).
 * 2. L'élève est relu en base, puis filtré par `buildEleveScopeWhere()` : aucun
 *    élève hors du périmètre de l'enseignant n'est jamais retourné.
 * 3. Seules les données d'identification sont exposées — aucune information
 *    financière ni coordonnée de tuteur.
 * 4. Les champs absents du modèle `Eleve` (photo, statut) valent `null` : ils
 *    sont affichés « — » côté interface, jamais inventés.
 *
 * Body: { scannedValue: string }
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  // Même règle que la route protégée /scanner-eleve (rôle exact ENSEIGNANT).
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const scannedValue = typeof body?.scannedValue === 'string' ? body.scannedValue : '';

  // ── 1. Format et signature du QR Code ──
  const parsed = parseEleveQrValue(scannedValue);
  if (!parsed.ok) {
    return NextResponse.json({ error: QR_INVALIDE }, { status: 400 });
  }
  if (parsed.format === 'signed' && !verifyEleveQrSignature(parsed.matricule, parsed.signature ?? '')) {
    return NextResponse.json({ error: QR_INVALIDE }, { status: 400 });
  }

  // ── 2. Recherche de l'élève (matricule, puis identifiant interne) ──
  let eleve = await prisma.eleve.findUnique({
    where: { matricule: parsed.matricule },
    include: { ecole: { select: ECOLE_SELECT } },
  });

  if (!eleve && parsed.format === 'legacy') {
    eleve = await prisma.eleve.findUnique({
      where: { id: parsed.matricule },
      include: { ecole: { select: ECOLE_SELECT } },
    });
  }

  if (!eleve) {
    return NextResponse.json({ error: QR_INVALIDE }, { status: 404 });
  }

  // ── 3. Périmètre de l'enseignant ──
  // Aucune donnée de l'élève n'est renvoyée en cas de refus.
  const scopeWhere = buildEleveScopeWhere(user);
  const scopedEleve = await prisma.eleve.findFirst({
    where: { ...scopeWhere, id: eleve.id },
    select: { id: true },
  });

  if (!scopedEleve) {
    return NextResponse.json(
      { authorized: false, error: 'Accès non autorisé pour cet élève.' },
      { status: 403 },
    );
  }

  // ── 4. Données d'identification autorisées ──
  return NextResponse.json({
    authorized: true,
    qr: { format: parsed.format, verified: parsed.format === 'signed' },
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      postNom: eleve.postNom,
      prenom: eleve.prenom,
      sexe: eleve.sexe || '',
      dateNaissance: eleve.dateNaissance ? eleve.dateNaissance.toISOString() : null,
      lieuNaissance: eleve.lieuNaissance || '',
      classe: eleve.classe,
      // Champs absents du modèle Eleve : null explicite, jamais de valeur inventée.
      photoUrl: null,
      statut: null,
      // Année scolaire dérivée de la date du jour (rentrée en septembre).
      anneeScolaire: currentAnneeScolaire(),
      ecole: eleve.ecole
        ? {
            nom: eleve.ecole.nom,
            dinacope: eleve.ecole.dinacope || '',
            province: eleve.ecole.province || '',
            provinceEducationnelle: eleve.ecole.provinceEducationnelle || '',
          }
        : null,
    },
  });
}
