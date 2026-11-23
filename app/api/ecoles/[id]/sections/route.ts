import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { isSectionScolaire, SECTIONS_SCOLAIRES } from '@/lib/ecole-sections';
import { guardEcoleStructure } from '@/lib/ecole-structure-guard';

const createSchema = z.object({
  nom: z.string().trim().min(1, 'La section est obligatoire.'),
});

/** GET /api/ecoles/[id]/sections — sections et options configurées. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const sections = await prisma.ecoleSection.findMany({
    where: { ecoleId: params.id },
    include: { options: { orderBy: { nom: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    sections,
    nbSectionsActives: sections.filter((s) => s.statut === 'Actif').length,
    nbOptionsActives: sections.reduce(
      (total, s) => total + s.options.filter((o) => o.statut === 'Actif').length,
      0,
    ),
  });
}

/** POST /api/ecoles/[id]/sections — ajouter une section (sans doublon). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const nom = parsed.data.nom;
  if (!isSectionScolaire(nom)) {
    return NextResponse.json(
      { error: `Section invalide. Sections autorisées : ${SECTIONS_SCOLAIRES.join(', ')}.` },
      { status: 400 },
    );
  }

  const duplicate = await prisma.ecoleSection.findFirst({
    where: { ecoleId: params.id, nom: { equals: nom, mode: 'insensitive' } },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json({ error: `La section « ${nom} » existe déjà pour cet établissement.` }, { status: 409 });
  }

  const section = await prisma.ecoleSection.create({
    data: { ecoleId: params.id, nom },
    include: { options: true },
  });

  return NextResponse.json({ section }, { status: 201 });
}
