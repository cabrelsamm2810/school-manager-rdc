import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';

/**
 * GET /api/presences/seances — liste des séances de présence de l'enseignant.
 * Query: periode=jour|semaine|mois|annee, classe, statut
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periode = searchParams.get('periode') || 'mois';
  const classe = searchParams.get('classe') || undefined;
  const statut = searchParams.get('statut') || undefined;

  const now = new Date();
  let dateDebut = new Date(now);
  dateDebut.setHours(0, 0, 0, 0);

  if (periode === 'jour') {
    // aujourd'hui
  } else if (periode === 'semaine') {
    dateDebut.setDate(dateDebut.getDate() - 7);
  } else if (periode === 'mois') {
    dateDebut.setMonth(dateDebut.getMonth() - 1);
  } else if (periode === 'annee') {
    dateDebut = new Date(now.getFullYear(), 0, 1);
  }

  const where: Record<string, unknown> = {
    enseignantId: user.id,
    date: { gte: dateDebut },
  };
  if (classe) where.classe = classe;
  if (statut) where.statut = statut;

  const seances = await prisma.seancePresence.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 100,
    include: {
      _count: { select: { presences: true } },
    },
  });

  return NextResponse.json({ seances });
}

/**
 * POST /api/presences/seances — créer une nouvelle séance de présence.
 * Body: { classe, matiere, anneeScolaire, date? }
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
  if (!body?.classe) {
    return NextResponse.json({ error: 'La classe est obligatoire.' }, { status: 400 });
  }

  const classe = String(body.classe).trim();
  const matiere = String(body.matiere || '').trim();
  const anneeScolaire = String(body.anneeScolaire || '').trim();
  const date = body.date ? new Date(body.date) : new Date();

  // Vérifier que l'enseignant a bien des élèves dans cette classe
  const eleveWhere = buildEleveScopeWhere(user);
  eleveWhere.classe = classe;
  const eleveCount = await prisma.eleve.count({ where: eleveWhere });

  if (eleveCount === 0) {
    return NextResponse.json(
      { error: 'Aucun élève trouvé dans cette classe pour votre périmètre.' },
      { status: 404 },
    );
  }

  // ── Empêcher les doublons : une seule séance active par enseignant+classe+matière+jour ──
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const existingSeance = await prisma.seancePresence.findFirst({
    where: {
      enseignantId: user.id,
      classe,
      matiere,
      statut: 'EN_COURS',
      date: { gte: todayStart, lte: todayEnd },
    },
  });

  if (existingSeance) {
    return NextResponse.json(
      { error: 'Une séance active existe déjà pour cette classe et matière aujourd\'hui.', seance: existingSeance },
      { status: 409 },
    );
  }

  // ── Valider l'affectation si des affectations explicites existent ──
  const enseignantRecord = await prisma.enseignant.findFirst({
    where: {
      OR: [{ email: user.email }, { nom: { contains: user.nom } }],
    },
  });

  if (enseignantRecord) {
    const affectation = await prisma.enseignantAffectation.findFirst({
      where: {
        enseignantId: enseignantRecord.id,
        classe,
        statut: 'Actif',
      },
    });

    if (affectation) {
      // Des affectations existent pour cette classe : vérifier la matière
      if (matiere) {
        const matiereAffectee = await prisma.enseignantAffectation.findFirst({
          where: {
            enseignantId: enseignantRecord.id,
            classe,
            matiere,
            statut: 'Actif',
          },
        });
        if (!matiereAffectee) {
          return NextResponse.json(
            { error: 'Vous n\'êtes pas affecté à cette matière pour cette classe.' },
            { status: 403 },
          );
        }
      }
    }
  }

  const enseignantNom = `${user.nom} ${user.postNom} ${user.prenom}`.trim().replace(/\s+/g, ' ');

  const seance = await prisma.seancePresence.create({
    data: {
      classe,
      matiere,
      anneeScolaire,
      enseignantId: user.id,
      enseignantNom,
      ecoleId: user.ecoleId || null,
      date,
      heureDebut: new Date(),
      statut: 'EN_COURS',
    },
  });

  return NextResponse.json({ seance }, { status: 201 });
}
