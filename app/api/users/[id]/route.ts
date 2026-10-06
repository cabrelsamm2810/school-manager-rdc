import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';

const updateSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  email: z.string().trim().email('L\u2019email est invalide.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  role: z.enum([
    'SUPER_ADMIN', 'COORDINATION_NATIONALE', 'COORDINATION_PROVINCIALE',
    'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL',
    'DIRECTION_ECOLE', 'ENSEIGNANT', 'PARENT', 'ELEVE'
  ]),
  fonction: z.string().trim().optional().or(z.literal('')),
  grade: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean(),
  password: z.string().min(8).optional(),
});

/** PUT /api/users/[id] — modifier un utilisateur. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'SUPER_ADMIN');
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
  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  if (data.email !== existing.email) {
    const conflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (conflict) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {
    nom: data.nom,
    postNom: data.postNom ?? '',
    prenom: data.prenom,
    email: data.email,
    telephone: data.telephone ?? '',
    role: data.role,
    fonction: data.fonction ?? '',
    grade: data.grade ?? '',
    isActive: data.isActive,
  };

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, role: true, isActive: true, createdAt: true,
      fonction: true, grade: true,
    },
  });

  return NextResponse.json({ user });
}

/** DELETE /api/users/[id] — supprimer un utilisateur. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'SUPER_ADMIN');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
