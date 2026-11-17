import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';

/**
 * Garde serveur de l'espace « Gestion des administrateurs ».
 *
 * Seul un SUPER_ADMIN authentifié (session cookie httpOnly) disposant de la
 * permission ADMINS_MANAGE peut agir. Le rôle du cookie `school_manager_role`
 * n'est jamais utilisé : la décision vient de la base.
 */

export type AdminManager = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
};

export type SuperAdminGuard =
  | { ok: true; user: AdminManager }
  | { ok: false; response: NextResponse };

export async function requireSuperAdmin(request: NextRequest): Promise<SuperAdminGuard> {
  const user = await getSessionUser(request);
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }) };
  }
  if (user.role !== 'SUPER_ADMIN' || !can(user.role, PERM.ADMINS_MANAGE)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Accès réservé au Super Administrateur.' }, { status: 403 }),
    };
  }
  return { ok: true, user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } };
}

/** Identité de l'auteur d'une action, pour `logAudit`. */
export function auditActor(user: AdminManager) {
  return {
    userId: user.id,
    userRole: user.role,
    userName: `${user.prenom} ${user.nom}`.trim(),
  };
}
