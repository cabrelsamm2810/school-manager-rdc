import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { ROLE_LABELS, ROLE_RANK } from '@/lib/roles';

// Hiérarchie et libellés des rôles : définis dans `lib/roles.ts` (module pur,
// importable par le middleware edge) et ré-exportés ici pour les appelants
// historiques de `@/lib/rbac`.
export { ROLE_LABELS, ROLE_RANK };

export const ALL_ROLES = Object.keys(ROLE_RANK) as (keyof typeof ROLE_RANK)[];

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export function isAdminSMD(role: string): boolean {
  return role === 'ADMIN_SCHOOL_MANAGER_RDC';
}

export function isRestrictedRole(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN_SCHOOL_MANAGER_RDC';
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
