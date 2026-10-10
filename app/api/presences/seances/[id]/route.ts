import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';

/**
 * GET /api/presences/seances/[id] — détails d'une séance avec élèves et présences.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const seance = await prisma.seancePresence.findUnique({
    where: { id: params.id },
    include: {
      presences: {
        include: {
          eleve: {
            select: { id: true, matricule: true, nom: true, postNom: true, prenom: true, classe: true },
          },
        },
      },
    },
  });

  if (!seance) {
    return NextResponse.json({ error: 'Séance introuvable.' }, { status: 404 });
  }
  if (seance.enseignantId !== user.id) {
    return NextResponse.json({ error: 'Accès non autorisé à cette séance.' }, { status: 403 });
  }

  // Récupérer tous les élèves de la classe (périmètre enseignant)
  const eleveWhere = buildEleveScopeWhere(user);
  eleveWhere.classe = seance.classe;
  const eleves = await prisma.eleve.findMany({
    where: eleveWhere,
    select: { id: true, matricule: true, nom: true, postNom: true, prenom: true, classe: true },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
  });

  // Construire la liste combinée: élève + sa présence (si elle existe)
  const presenceMap = new Map(seance.presences.map((p) => [p.eleveId, p]));
  const elevesAvecStatut = eleves.map((e) => {
    const p = presenceMap.get(e.id);
    return {
      ...e,
      presenceId: p?.id || null,
      statut: p?.statut || null,
      heureArrivee: p?.heureArrivee || null,
    };
  });

  return NextResponse.json({ seance, eleves: elevesAvecStatut });
}

/**
 * PUT /api/presences/seances/[id] — mettre à jour une séance (terminer l'appel).
 * Body: { action: 'terminer' }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const seance = await prisma.seancePresence.findUnique({ where: { id: params.id } });
  if (!seance) {
    return NextResponse.json({ error: 'Séance introuvable.' }, { status: 404 });
  }
  if (seance.enseignantId !== user.id) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === 'terminer') {
    const updated = await prisma.seancePresence.update({
      where: { id: params.id },
      data: { statut: 'TERMINEE', heureFin: new Date() },
    });
    return NextResponse.json({ seance: updated });
  }

  return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 });
}

/**
 * DELETE /api/presences/seances/[id] — supprimer une séance et ses présences.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const seance = await prisma.seancePresence.findUnique({ where: { id: params.id } });
  if (!seance) {
    return NextResponse.json({ error: 'Séance introuvable.' }, { status: 404 });
  }
  if (seance.enseignantId !== user.id) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  await prisma.seancePresence.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
