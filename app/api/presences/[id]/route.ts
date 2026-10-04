import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const updateSchema = z.object({
  date: z.string().trim().min(1, 'La date est obligatoire.'),
  present: z.boolean(),
  classe: z.string().trim().min(1, 'La classe est obligatoire.'),
});

/** PUT /api/presences/[id] — modifier une présence. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.presence.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Présence introuvable.' }, { status: 404 });
  }

  const presence = await prisma.presence.update({
    where: { id: params.id },
    data: {
      date: new Date(data.date),
      present: data.present,
      classe: data.classe,
    },
    include: { eleve: { select: { id: true, matricule: true, nom: true, postNom: true, prenom: true } } },
  });

  return NextResponse.json({ presence });
}

/** DELETE /api/presences/[id] — supprimer une présence. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.presence.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Présence introuvable.' }, { status: 404 });
  }

  await prisma.presence.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
