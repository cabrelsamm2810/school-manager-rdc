import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logAudit, getClientIP } from '@/lib/audit';
import { auditActor, requireSuperAdmin } from '@/lib/admin-management';
import { ADMIN_AUDIT_MODULE } from '@/lib/admin-registration';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['activer', 'desactiver']),
});

/**
 * POST /api/admin/administrateurs/[id]/action — activer ou désactiver un administrateur.
 *
 * - Compte déjà créé : l'activation/la désactivation porte sur le compte
 *   (`isActive` + `userStatus`), ce qui coupe immédiatement l'accès à l'espace admin.
 * - Autorisation encore en attente : le statut prévu est ajusté pour la future création.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin(request);
  if (!guard.ok) return guard.response;

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
  }

  const administrateur = await prisma.adminPreRegistration.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!administrateur) {
    return NextResponse.json({ error: 'Administrateur introuvable.' }, { status: 404 });
  }
  if (administrateur.statut === 'REVOQUE') {
    return NextResponse.json({ error: 'Cette autorisation est révoquée.' }, { status: 400 });
  }
  if (administrateur.user?.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Le compte Super Administrateur ne peut pas être modifié.' }, { status: 403 });
  }

  const activer = parsed.data.action === 'activer';

  if (administrateur.userId) {
    await prisma.user.update({
      where: { id: administrateur.userId },
      data: activer
        ? { isActive: true, userStatus: 'ACTIF' }
        : { isActive: false, userStatus: 'DESACTIVE' },
    });
  } else {
    await prisma.adminPreRegistration.update({
      where: { id: params.id },
      data: { statutPrevu: activer ? 'ACTIF' : 'INACTIF' },
    });
  }

  await logAudit({
    ...auditActor(guard.user),
    action: activer ? 'ADMIN_ACTIVE' : 'ADMIN_DESACTIVE',
    module: ADMIN_AUDIT_MODULE,
    resource: administrateur.email,
    resourceId: administrateur.id,
    details: `${activer ? 'Activation' : 'Désactivation'} de ${administrateur.prenom} ${administrateur.nom} (${administrateur.email})${administrateur.userId ? '' : ' — autorisation en attente de compte'}.`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ ok: true, action: parsed.data.action, compte: Boolean(administrateur.userId) });
}
