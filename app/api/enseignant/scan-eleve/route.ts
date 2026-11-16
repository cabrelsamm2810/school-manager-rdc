import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { canAccessPath } from '@/lib/route-access';
import { isSignedEleveQr, parseEleveQrValue } from '@/lib/eleve-qr';
import { resolveFileUrl } from '@/lib/storage';

/** Message unique affiché pour tout QR code inconnu, invalide ou expiré. */
const INVALID_QR = 'QR Code élève invalide ou introuvable.';

const ECOLE_SELECT = {
  id: true,
  nom: true,
  dinacope: true,
  province: true,
  provinceEducationnelle: true,
  statut: true,
} as const;

/**
 * Année scolaire en cours (rentrée en septembre), utilisée seulement si
 * l'élève n'a encore aucun enregistrement académique portant une année.
 */
function currentAnneeScolaire(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 8 ? year : year - 1;
  return `${start}-${start + 1}`;
}

/**
 * POST /api/enseignant/scan-eleve
 * Identifie un élève à partir du QR code de sa carte scolaire.
 *
 * - Accepte un QR signé (`lib/eleve-qr.ts`) ou, pour les cartes déjà imprimées,
 *   un matricule / une URL contenant `matricule` ou `id`.
 * - Ne retourne jamais les données d'un élève hors du périmètre du role connecté
 *   (aucune information n'est renvoyée en cas de refus).
 * - Ne retourne aucune donnée financière ni coordonnée de tuteur.
 *
 * Body: { scannedValue: string }
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  // Même règle que la route /scanner-eleve : le module suit les permissions du rôle.
  if (!canAccessPath(user.role, '/scanner-eleve')) {
    return NextResponse.json({ error: 'Accès non autorisé au scanner.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const scannedValue = typeof body?.scannedValue === 'string' ? body.scannedValue.trim() : '';

  if (!scannedValue) {
    return NextResponse.json({ error: 'Valeur scannée vide.' }, { status: 400 });
  }

  // ── 1. Identifier l'élève ──
  // QR signé : la signature prouve que le code vient de School Manager RDC.
  let eleveId: string | null = null;
  if (isSignedEleveQr(scannedValue)) {
    const parsed = parseEleveQrValue(scannedValue);
    if (!parsed.ok) {
      return NextResponse.json({ error: INVALID_QR }, { status: 400 });
    }
    eleveId = parsed.eleveId;
  }

  let eleve = eleveId
    ? await prisma.eleve.findUnique({
        where: { id: eleveId },
        include: { ecole: { select: ECOLE_SELECT } },
      })
    : null;

  // Cartes existantes : matricule en clair, URL avec matricule/id, ou id interne.
  if (!eleve) {
    eleve = await prisma.eleve.findUnique({
      where: { matricule: scannedValue },
      include: { ecole: { select: ECOLE_SELECT } },
    });
  }

  if (!eleve) {
    try {
      const url = new URL(scannedValue);
      const value = url.searchParams.get('matricule') || url.searchParams.get('id');
      if (value) {
        eleve = await prisma.eleve.findUnique({
          where: { matricule: value },
          include: { ecole: { select: ECOLE_SELECT } },
        });
        if (!eleve) {
          eleve = await prisma.eleve.findUnique({
            where: { id: value },
            include: { ecole: { select: ECOLE_SELECT } },
          });
        }
      }
    } catch {
      // Pas une URL valide : on continue avec les autres tentatives.
    }
  }

  if (!eleve) {
    eleve = await prisma.eleve.findUnique({
      where: { id: scannedValue },
      include: { ecole: { select: ECOLE_SELECT } },
    });
  }

  if (!eleve) {
    return NextResponse.json({ error: INVALID_QR }, { status: 404 });
  }

  // ── 2. Périmètre du role connecté ──
  // Aucune donnée de l'élève n'est renvoyée en cas de refus.
  const scopeWhere = buildEleveScopeWhere(user);
  const scoped = await prisma.eleve.findFirst({
    where: { ...scopeWhere, id: eleve.id },
    select: { id: true },
  });

  if (!scoped) {
    return NextResponse.json(
      { authorized: false, error: 'Accès non autorisé pour cet élève.' },
      { status: 403 },
    );
  }

  // ── 3. Année scolaire réelle de l'élève (dernier enregistrement académique) ──
  const yearFilter = { eleveId: eleve.id, anneeScolaire: { not: '' } };
  const [cahier, bulletin, presence] = await Promise.all([
    prisma.cahierDeCote.findFirst({
      where: yearFilter,
      orderBy: { updatedAt: 'desc' },
      select: { anneeScolaire: true },
    }),
    prisma.bulletin.findFirst({
      where: yearFilter,
      orderBy: { createdAt: 'desc' },
      select: { anneeScolaire: true },
    }),
    prisma.presence.findFirst({
      where: yearFilter,
      orderBy: { date: 'desc' },
      select: { anneeScolaire: true },
    }),
  ]);
  const anneeScolaire =
    cahier?.anneeScolaire || bulletin?.anneeScolaire || presence?.anneeScolaire || currentAnneeScolaire();

  // ── 4. Fiche élève (identité + établissement uniquement) ──
  return NextResponse.json({
    authorized: true,
    scannedAt: new Date().toISOString(),
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
      anneeScolaire,
      // Le dossier élève ne porte pas encore de statut propre : la valeur est
      // déduite de l'établissement de rattachement, jamais inventée.
      statut: eleve.ecole
        ? eleve.ecole.statut === 'Actif'
          ? 'Inscrit'
          : 'École inactive'
        : 'Non affecté',
      photoUrl: await resolveFileUrl(eleve.photoUrl, { signed: true }),
      ecole: eleve.ecole
        ? {
            id: eleve.ecole.id,
            nom: eleve.ecole.nom,
            dinacope: eleve.ecole.dinacope || '',
            province: eleve.ecole.province || '',
            provinceEducationnelle: eleve.ecole.provinceEducationnelle || '',
            statut: eleve.ecole.statut || '',
          }
        : null,
    },
  });
}
