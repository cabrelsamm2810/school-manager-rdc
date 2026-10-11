import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { CLASSES_RDC } from '@/lib/curriculum-rdc';
import { isSimpleFlowClass } from '@/lib/presence-flow';

/**
 * GET /api/enseignant-affectations
 * Params: enseignantId, classe, ecoleId
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enseignantId = searchParams.get('enseignantId') || undefined;
  const classe = searchParams.get('classe') || undefined;
  const ecoleId = searchParams.get('ecoleId') || undefined;

  const where: Record<string, unknown> = {};
  if (enseignantId) where.enseignantId = enseignantId;
  if (classe) where.classe = classe;
  if (ecoleId) where.ecoleId = ecoleId;

  const affectations = await prisma.enseignantAffectation.findMany({
    where,
    include: {
      enseignant: { select: { id: true, nom: true, matricule: true } },
      ecole: { select: { id: true, nom: true } },
    },
    orderBy: [{ classe: 'asc' }, { matiere: 'asc' }],
  });

  return NextResponse.json({ affectations });
}

/**
 * POST /api/enseignant-affectations
 * Body: { enseignantId, classe, matiere?, ecoleId? }
 * Détermine automatiquement le niveau (cycle) à partir de la classe.
 * Pour les classes en flux simple (Maternel/Primaire), la matière est vide.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.enseignantId || !body?.classe) {
    return NextResponse.json({ error: 'Enseignant et classe sont obligatoires.' }, { status: 400 });
  }

  const enseignantId = String(body.enseignantId);
  const classe = String(body.classe).trim();
  const isSimple = isSimpleFlowClass(classe);

  // En flux simple, pas de matière (titulaire → classe)
  let matiere = '';
  if (!isSimple && body.matiere) {
    matiere = String(body.matiere).trim();
  }

  // Déterminer le niveau (cycle) à partir du curriculum
  const classeEntry = CLASSES_RDC.find((c) => c.nom === classe);
  const niveau = classeEntry?.cycle || '';

  // Vérifier l'existence de l'enseignant
  const enseignant = await prisma.enseignant.findUnique({ where: { id: enseignantId } });
  if (!enseignant) {
    return NextResponse.json({ error: 'Enseignant introuvable.' }, { status: 404 });
  }

  // Vérifier l'unicité (gérée par @@unique mais on renvoie un message clair)
  const existing = await prisma.enseignantAffectation.findFirst({
    where: { enseignantId, classe, matiere },
  });
  if (existing) {
    return NextResponse.json({ error: 'Cette affectation existe déjà.' }, { status: 409 });
  }

  const affectation = await prisma.enseignantAffectation.create({
    data: {
      enseignantId,
      classe,
      matiere,
      niveau,
      ecoleId: enseignant.ecoleId || body.ecoleId || null,
      statut: 'Actif',
    },
    include: {
      enseignant: { select: { id: true, nom: true, matricule: true } },
    },
  });

  return NextResponse.json({ affectation }, { status: 201 });
}

/**
 * DELETE /api/enseignant-affectations
 * Body: { id } ou { enseignantId, classe, matiere }
 */
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Corps de requête manquant.' }, { status: 400 });
  }

  if (body.id) {
    await prisma.enseignantAffectation.delete({ where: { id: String(body.id) } });
    return NextResponse.json({ ok: true });
  }

  if (body.enseignantId && body.classe) {
    await prisma.enseignantAffectation.deleteMany({
      where: {
        enseignantId: String(body.enseignantId),
        classe: String(body.classe),
        matiere: String(body.matiere || ''),
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Paramètres insuffisants.' }, { status: 400 });
}
