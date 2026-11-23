import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { guardEcoleStructure } from '@/lib/ecole-structure-guard';

const createSchema = z.object({
  nom: z.string().trim().min(2, "Le nom de l'option est obligatoire."),
});

/** GET /api/ecoles/[id]/sections/[sectionId]/options — options de la section. */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } },
) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const section = await prisma.ecoleSection.findFirst({
    where: { id: params.sectionId, ecoleId: params.id },
    select: { id: true },
  });
  if (!section) return NextResponse.json({ error: 'Section introuvable.' }, { status: 404 });

  const options = await prisma.ecoleOption.findMany({
    where: { sectionId: section.id },
    orderBy: { nom: 'asc' },
  });

  return NextResponse.json({ options });
}

/** POST /api/ecoles/[id]/sections/[sectionId]/options — ajouter une option. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } },
) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const section = await prisma.ecoleSection.findFirst({
    where: { id: params.sectionId, ecoleId: params.id },
    select: { id: true, nom: true },
  });
  if (!section) return NextResponse.json({ error: 'Section introuvable.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const nom = parsed.data.nom;
  const duplicate = await prisma.ecoleOption.findFirst({
    where: { sectionId: section.id, nom: { equals: nom, mode: 'insensitive' } },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: `L'option « ${nom} » existe déjà dans la section ${section.nom}.` },
      { status: 409 },
    );
  }

  const option = await prisma.ecoleOption.create({
    data: { ecoleId: params.id, sectionId: section.id, nom },
  });

  return NextResponse.json({ option }, { status: 201 });
}
