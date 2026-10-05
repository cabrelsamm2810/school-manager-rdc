import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const updateSchema = z.object({
  titre: z.string().trim().min(1, 'Le titre est obligatoire.'),
  type: z.enum(['cours', 'activite']).optional().or(z.literal('')),
  classe: z.string().trim().min(1, 'La classe est obligatoire.'),
  eleveId: z.string().trim().optional().or(z.literal('')),
  date: z.string().min(1, 'La date est obligatoire.'),
  heureDebut: z.string().trim().optional().or(z.literal('')),
  heureFin: z.string().trim().optional().or(z.literal('')),
  salle: z.string().trim().optional().or(z.literal('')),
  enseignant: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().optional().or(z.literal('')),
  couleur: z.string().trim().optional().or(z.literal(''))
});

/** PUT /api/cours/[id] — modifier un cours. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
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
  const existing = await prisma.cours.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Cours introuvable.' }, { status: 404 });
  }

  const cours = await prisma.cours.update({
    where: { id: params.id },
    data: {
      titre: data.titre,
      type: data.type || 'cours',
      classe: data.classe,
      eleveId: data.eleveId || null,
      date: new Date(data.date),
      heureDebut: data.heureDebut ?? '',
      heureFin: data.heureFin ?? '',
      salle: data.salle ?? '',
      enseignant: data.enseignant ?? '',
      description: data.description ?? '',
      couleur: data.couleur ?? ''
    }
  });

  return NextResponse.json({ cours });
}

/** DELETE /api/cours/[id] — supprimer un cours. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.cours.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Cours introuvable.' }, { status: 404 });
  }

  await prisma.cours.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
