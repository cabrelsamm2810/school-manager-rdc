import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';

export async function requireRole(request: NextRequest, requiredRole: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { ok: false, redirect: '/login', error: 'Session introuvable.' };
  }

  const rolePriority: Record<string, number> = {
    SUPER_ADMIN: 10,
    COORDINATION_NATIONALE: 9,
    COORDINATION_PROVINCIALE: 8,
    AGENT_PROVINCIAL: 7,
    COORDINATION_SOUS_PROVINCIALE: 6,
    AGENT_SOUS_PROVINCIAL: 5,
    DIRECTION_ECOLE: 4,
    ENSEIGNANT: 3,
    PARENT: 2,
    ELEVE: 1
  };

  if ((rolePriority[user.role] ?? 0) < (rolePriority[requiredRole] ?? 0)) {
    return { ok: false, redirect: '/dashboard', error: 'Rôle insuffisant pour accéder à cette ressource.' };
  }

  return { ok: true, user };
}

export async function requireAuth(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return { ok: false, redirect: '/login', error: 'Connexion requise.' };
  }

  return { ok: true, user };
}

export function awaitOrRedirect(response: NextResponse | null, redirectTo: string) {
  if (!response) return NextResponse.redirect(new URL(redirectTo, 'http://localhost:3000'));
  return response;
}
