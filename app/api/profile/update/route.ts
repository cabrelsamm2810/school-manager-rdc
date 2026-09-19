import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const updateProfileSchema = z.object({
  nom: z.string().min(2).optional(),
  postNom: z.string().optional(),
  prenom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional(),
  role: z.enum([
    'SUPER_ADMIN',
    'COORDINATION_NATIONALE',
    'COORDINATION_PROVINCIALE',
    'AGENT_PROVINCIAL',
    'COORDINATION_SOUS_PROVINCIALE',
    'AGENT_SOUS_PROVINCIAL',
    'DIRECTION_ECOLE',
    'ENSEIGNANT',
    'PARENT',
    'ELEVE'
  ]).optional()
});

export async function PATCH(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session },
    data: parsed.data
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      nom: user.nom,
      postNom: user.postNom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      profilePhotoUrl: user.profilePhotoUrl
    }
  });
}
