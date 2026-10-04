import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';

/**
 * Hiérarchie des rôles RBAC de School Manager RDC.
 * Plus le rang est élevé, plus l'utilisateur a de privilèges.
 */
export const ROLE_RANK: Record<string, number> = {
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

export const ALL_ROLES = Object.keys(ROLE_RANK) as (keyof typeof ROLE_RANK)[];

/** Labels affichables pour chaque rôle. */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  COORDINATION_NATIONALE: 'Coordination nationale',
  COORDINATION_PROVINCIALE: 'Coordination provinciale',
  AGENT_PROVINCIAL: 'Agent provincial',
  COORDINATION_SOUS_PROVINCIALE: 'Coordination sous provinciale',
  AGENT_SOUS_PROVINCIAL: 'Agent sous provincial',
  DIRECTION_ECOLE: 'Direction d’éécole',
  ENSEIGNANT: 'Enseignant',
  PARENT: 'Parent',
  ELEVE: 'Élève'
};

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export function hasAtLeastRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[requiredRole] ?? 0);
}

export async function requireAuth(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return { ok: false as const, redirect: '/login', error: 'Connexion requise.' };
  }
  return { ok: true as const, user };
}

export async function requireRole(request: NextRequest, requiredRole: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { ok: false as const, redirect: '/login', error: 'Session introuvable.' };
  }
  if (!hasAtLeastRole(user.role, requiredRole)) {
    return { ok: false as const, redirect: '/dashboard', error: 'Rôle insuffisant pour accéder à cette ressource.' };
  }
  return { ok: true as const, user };
}

export function redirectOrContinue(result: { ok: false; redirect: string; error: string }) {
  return NextResponse.redirect(new URL(result.redirect, 'http://localhost:3000'));
}
