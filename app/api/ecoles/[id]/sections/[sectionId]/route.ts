import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { isSectionScolaire, SECTIONS_SCOLAIRES } from '@/lib/ecole-sections';
import { guardEcoleStructure } from '@/lib/ecole-structure-guard';

const updateSchema = z.object({
  nom: z.string().trim().min(1, 'La section est obligatoire.').optional(),
  statut: z.enum(['Actif', 'Inactif']).optional(),
});

/** PATCH /api/ecoles/[id]/sections/[sectionId] — modifier une section. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } },
) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const existing = await prisma.ecoleSection.findFirst({
    where: { id: params.sectionId, ecoleId: params.id },
  });
  if (!existing) return NextResponse.json({ error: 'Section introuvable.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const { nom, statut } = parsed.data;
  if (nom && !isSectionScolaire(nom)) {
    return NextResponse.json(
      { error: `Section invalide. Sections autorisées : ${SECTIONS_SCOLAIRES.join(', ')}.` },
      { status: 400 },
    );
  }
  if (nom && nom.toLowerCase() !== existing.nom.toLowerCase()) {
    const duplicate = await prisma.ecoleSection.findFirst({
      where: {
        ecoleId: params.id,
        id: { not: existing.id },
        nom: { equals: nom, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: `La section « ${nom} » existe déjà pour cet établissement.` }, { status: 409 });
    }
  }

  const section = await prisma.ecoleSection.update({
    where: { id: existing.id },
    data: { nom: nom ?? undefined, statut: statut ?? undefined },
    include: { options: { orderBy: { nom: 'asc' } } },
  });

  return NextResponse.json({ section });
}

/** DELETE /api/ecoles/[id]/sections/[sectionId] — retirer une section et ses options. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } },
) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const existing = await prisma.ecoleSection.findFirst({
    where: { id: params.sectionId, ecoleId: params.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Section introuvable.' }, { status: 404 });

  await prisma.ecoleSection.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
