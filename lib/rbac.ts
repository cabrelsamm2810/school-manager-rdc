import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/session';

export async function requireRole(request: NextRequest, requiredRole: string) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { ok: false, redirect: '/login' };
  }

  if (user.role !== requiredRole && !hasAtLeastRole(user.role, requiredRole)) {
    return { ok: false, redirect: '/dashboard' };
  }

  return { ok: true, user };
}

const ROLE_RANK: Record<string, number> = {
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

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export function hasAtLeastRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[requiredRole] ?? 0);
}

export function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = ['/dashboard', '/profile'];
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function enforceRoleAccess(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user.role === 'ELEVE' && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}
