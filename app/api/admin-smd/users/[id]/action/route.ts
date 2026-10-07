import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';
import { logAudit, getClientIP } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['activate', 'suspend', 'reactivate', 'deactivate']),
});

const ACTION_CONFIG: Record<string, {
  permission: typeof PERM[keyof typeof PERM];
  userStatus: string;
  isActive: boolean;
  auditAction: string;
  label: string;
}> = {
  activate: {
    permission: PERM.ADMIN_USER_VALIDATE,
    userStatus: 'ACTIF',
    isActive: true,
    auditAction: 'ACTIVATE_USER',
    label: 'Activation du compte',
  },
  suspend: {
    permission: PERM.ADMIN_USER_SUSPEND,
    userStatus: 'SUSPENDU',
    isActive: false,
    auditAction: 'SUSPEND_USER',
    label: 'Suspension du compte',
  },
  reactivate: {
    permission: PERM.ADMIN_USER_REACTIVATE,
    userStatus: 'ACTIF',
    isActive: true,
    auditAction: 'REACTIVATE_USER',
    label: 'Réactivation du compte',
  },
  deactivate: {
    permission: PERM.ADMIN_USER_SUSPEND,
    userStatus: 'DESACTIVE',
    isActive: false,
    auditAction: 'DEACTIVATE_USER',
    label: 'Désactivation du compte',
  },
};

/**
 * POST /api/admin-smd/users/[id]/action — action administrative sur un compte.
 *
 * Actions : activate, suspend, reactivate, deactivate.
 *
 * Protections :
 * - Ne peut pas agir sur son propre compte.
 * - Ne peut pas agir sur un compte SUPER_ADMIN.
 * - Chaque action exige sa permission spécifique.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  // ── Ne pas agir sur son propre compte ──
  if (currentUser.id === params.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas effectuer cette action sur votre propre compte.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Action invalide.' },
      { status: 400 }
    );
  }

  const config = ACTION_CONFIG[parsed.data.action];
  if (!config) {
    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 });
  }

  // ── Vérification de la permission spécifique ──
  if (!can(currentUser.role, config.permission)) {
    return NextResponse.json(
      { error: `Permission insuffisante pour cette action.` },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, nom: true, prenom: true, email: true, role: true, userStatus: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  // ── Ne pas agir sur un SUPER_ADMIN ──
  if (target.role === 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Les comptes Super Administrateur ne peuvent pas être modifiés.' },
      { status: 403 }
    );
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      userStatus: config.userStatus,
      isActive: config.isActive,
    },
    select: {
      id: true, nom: true, prenom: true, email: true, role: true,
      isActive: true, userStatus: true,
    },
  });

  // ── Journal d'audit ──
  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: `${currentUser.prenom} ${currentUser.nom}`.trim(),
    action: config.auditAction,
    module: 'users',
    resourceId: params.id,
    details: `${config.label} : ${target.prenom} ${target.nom} (${target.email}) — statut précédent : ${target.userStatus}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ user, action: parsed.data.action });
}
