import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireNationalAccess, displayName } from '@/lib/national-access';
import { logAudit, getClientIP } from '@/lib/audit';

const MANAGED_ROLE = 'COORDINATION_PROVINCIALE';

const actionSchema = z.object({
  action: z.enum(['suspend', 'reactivate']),
});

/**
 * PATCH /api/coordination-nationale/coordinateurs/[id]
 * Suspension / réactivation d'un compte de coordination provinciale.
 * Un compte d'un autre rôle ne peut jamais être modifié ici.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;
  const currentUser = auth.user;

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true, email: true, userStatus: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }
  if (target.role !== MANAGED_ROLE) {
    return NextResponse.json(
      { error: 'Seuls les comptes de coordination provinciale sont gérables ici.' },
      { status: 403 },
    );
  }

  const suspend = parsed.data.action === 'suspend';
  const coordinateur = await prisma.user.update({
    where: { id: target.id },
    data: suspend
      ? { isActive: false, userStatus: 'SUSPENDU' }
      : { isActive: true, userStatus: 'ACTIF' },
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, provinceAdministrative: true, fonction: true, grade: true,
      isActive: true, userStatus: true, createdAt: true,
    },
  });

  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: displayName(currentUser),
    action: suspend ? 'SUSPEND_COORDINATEUR_PROVINCIAL' : 'REACTIVATE_COORDINATEUR_PROVINCIAL',
    module: 'coordination-nationale',
    resource: 'user',
    resourceId: target.id,
    details: `${suspend ? 'Suspension' : 'Réactivation'} du compte ${target.email}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ coordinateur });
}
