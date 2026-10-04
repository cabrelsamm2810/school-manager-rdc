import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const updateSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  type: z.string().trim().optional().or(z.literal('')),
  province: z.string().trim().optional().or(z.literal('')),
  ville: z.string().trim().optional().or(z.literal('')),
  adresse: z.string().trim().optional().or(z.literal('')),
  telephone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('L\u2019email est invalide.').optional().or(z.literal('')),
  effectif: z.number().int().min(0).optional(),
  statut: z.string().trim().optional().or(z.literal('')),
});

/** PUT /api/etablissements/[id] — modifier un établissement. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Donn\u00e9es invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.etablissement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  const etablissement = await prisma.etablissement.update({
    where: { id: params.id },
    data: {
      nom: data.nom,
      type: data.type ?? '',
      province: data.province ?? '',
      ville: data.ville ?? '',
      adresse: data.adresse ?? '',
      telephone: data.telephone ?? '',
      email: data.email ?? '',
      effectif: data.effectif ?? 0,
      statut: data.statut ?? 'Actif',
    },
  });

  return NextResponse.json({ etablissement });
}

/** DELETE /api/etablissements/[id] — supprimer un établissement. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.etablissement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  await prisma.etablissement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
