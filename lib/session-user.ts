import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function getSessionUser(request: NextRequest) {
  const sessionId = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!sessionId) return null;
  return prisma.user.findFirst({
    where: { id: sessionId, isActive: true },
    select: { id: true, email: true, role: true, nom: true, postNom: true, prenom: true, telephone: true, profilePhotoUrl: true }
  });
}
