import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';

/**
 * POST /api/enseignant/scan-eleve
 * Identifie un élève à partir du scan de son QR code (carte scolaire).
 * Vérifie que l'élève appartient au périmètre de l'enseignant (classes/école).
 * Ne retourre AUCUNE information financière — uniquement les données
 * d'identification autorisées pour un enseignant.
 *
 * Body: { scannedValue: string }
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const scannedValue = body?.scannedValue?.trim();

  if (!scannedValue) {
    return NextResponse.json({ error: 'Valeur scannée vide.' }, { status: 400 });
  }

  // ── 1. Identifier l'élève à partir du QR code ──
  let eleve = await prisma.eleve.findUnique({
    where: { matricule: scannedValue },
    include: { ecole: { select: { nom: true, id: true } } },
  });

  // Tentative 2: extraire le matricule depuis une URL
  if (!eleve) {
    try {
      const url = new URL(scannedValue);
      const matricule = url.searchParams.get('matricule') || url.searchParams.get('id');
      if (matricule) {
        eleve = await prisma.eleve.findUnique({
          where: { matricule },
          include: { ecole: { select: { nom: true, id: true } } },
        });
      }
    } catch {
      // Pas une URL valide
    }
  }

  // Tentative 3: chercher par ID
  if (!eleve) {
    eleve = await prisma.eleve.findUnique({
      where: { id: scannedValue },
      include: { ecole: { select: { nom: true, id: true } } },
    });
  }

  if (!eleve) {
    return NextResponse.json(
      { error: 'Aucun élève trouvé pour cette carte scolaire.' },
      { status: 404 },
    );
  }

  // ── 2. Vérification du périmètre de l'enseignant ──
  // L'élève doit appartenir à une classe/école que l'enseignant peut gérer.
  const scopeWhere = buildEleveScopeWhere(user);
  const scopedEleve = await prisma.eleve.findFirst({
    where: { ...scopeWhere, id: eleve.id },
  });

  if (!scopedEleve) {
    return NextResponse.json(
      {
        authorized: false,
        error: 'Accès non autorisé pour cet élève.',
        eleve: {
          nom: eleve.nom,
          postNom: eleve.postNom,
          prenom: eleve.prenom,
          classe: eleve.classe,
        },
      },
      { status: 403 },
    );
  }

  // ── 3. Retourner uniquement les informations autorisées ──
  // PAS de données financières, PAS de coordonnées de tuteurs.
  return NextResponse.json({
    authorized: true,
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      postNom: eleve.postNom,
      prenom: eleve.prenom,
      classe: eleve.classe,
      sexe: eleve.sexe || '',
      dateNaissance: eleve.dateNaissance?.toISOString() || null,
      lieuNaissance: eleve.lieuNaissance || '',
      ecole: eleve.ecole?.nom || null,
    },
  });
}
