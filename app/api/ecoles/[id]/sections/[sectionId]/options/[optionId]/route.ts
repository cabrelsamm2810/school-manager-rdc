import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { guardEcoleStructure } from '@/lib/ecole-structure-guard';

const updateSchema = z.object({
  nom: z.string().trim().min(2, "Le nom de l'option est obligatoire.").optional(),
  statut: z.enum(['Actif', 'Inactif']).optional(),
});

/** PATCH /api/ecoles/[id]/sections/[sectionId]/options/[optionId] — modifier une option. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string; optionId: string } },
) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const existing = await prisma.ecoleOption.findFirst({
    where: { id: params.optionId, sectionId: params.sectionId, ecoleId: params.id },
  });
  if (!existing) return NextResponse.json({ error: 'Option introuvable.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const { nom, statut } = parsed.data;
  if (nom && nom.toLowerCase() !== existing.nom.toLowerCase()) {
    const duplicate = await prisma.ecoleOption.findFirst({
      where: {
        sectionId: existing.sectionId,
        id: { not: existing.id },
        nom: { equals: nom, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: `L'option « ${nom} » existe déjà dans cette section.` }, { status: 409 });
    }
  }

  const option = await prisma.ecoleOption.update({
    where: { id: existing.id },
    data: { nom: nom ?? undefined, statut: statut ?? undefined },
  });

  return NextResponse.json({ option });
}

/** DELETE /api/ecoles/[id]/sections/[sectionId]/options/[optionId] — retirer une option. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string; optionId: string } },
) {
  const guard = await guardEcoleStructure(request, params.id);
  if ('error' in guard) return guard.error;

  const existing = await prisma.ecoleOption.findFirst({
    where: { id: params.optionId, sectionId: params.sectionId, ecoleId: params.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Option introuvable.' }, { status: 404 });

  await prisma.ecoleOption.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
