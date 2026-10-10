import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { ROLE_LABELS } from '@/lib/rbac';
import { resolveFileUrl } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { not: currentUser.id },
    },
    select: {
      id: true,
      nom: true,
      postNom: true,
      prenom: true,
      email: true,
      role: true,
      telephone: true,
      profilePhotoUrl: true,
      institutionName: true,
    },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
  });

  return NextResponse.json(
    await Promise.all(users.map(async (u) => ({
      ...u,
      profilePhotoUrl: await resolveFileUrl(u.profilePhotoUrl),
      roleLabel: ROLE_LABELS[u.role] ?? u.role,
      displayName: `${u.prenom} ${u.nom}`.trim(),
    })))
  );
}
