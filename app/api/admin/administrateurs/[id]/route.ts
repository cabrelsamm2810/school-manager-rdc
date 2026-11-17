import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit, getClientIP } from '@/lib/audit';
import { auditActor, requireSuperAdmin } from '@/lib/admin-management';
import {
  ADMIN_AUDIT_MODULE,
  adminPreRegistrationUpdateSchema,
} from '@/lib/admin-registration';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/administrateurs/[id] — détail + historique des activités.
 * PATCH — modifier l'identité / le statut prévu d'une autorisation.
 * DELETE — révoquer l'autorisation (et désactiver le compte lié s'il existe).
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin(request);
  if (!guard.ok) return guard.response;

  const administrateur = await prisma.adminPreRegistration.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, email: true, role: true, isActive: true, userStatus: true, createdAt: true } },
      createdBy: { select: { nom: true, prenom: true } },
    },
  });
  if (!administrateur) {
    return NextResponse.json({ error: 'Administrateur introuvable.' }, { status: 404 });
  }

  const history = await prisma.auditLog.findMany({
    where: { OR: [{ resourceId: administrateur.id }, { module: ADMIN_AUDIT_MODULE, resource: administrateur.email }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, userName: true, userRole: true, action: true, result: true,
      details: true, ipAddress: true, createdAt: true,
    },
  });

  return NextResponse.json({ administrateur, history });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin(request);
  if (!guard.ok) return guard.response;

  const parsed = adminPreRegistrationUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const existing = await prisma.adminPreRegistration.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Administrateur introuvable.' }, { status: 404 });
  }
  if (existing.statut === 'REVOQUE') {
    return NextResponse.json({ error: 'Cette autorisation est révoquée et ne peut plus être modifiée.' }, { status: 400 });
  }

  const administrateur = await prisma.adminPreRegistration.update({
    where: { id: params.id },
    data: {
      nom: parsed.data.nom,
      postNom: parsed.data.postNom ?? '',
      prenom: parsed.data.prenom,
      telephone: parsed.data.telephone ?? '',
      statutPrevu: parsed.data.statutPrevu,
    },
    select: { id: true, email: true, nom: true, postNom: true, prenom: true, telephone: true, statut: true, statutPrevu: true },
  });

  await logAudit({
    ...auditActor(guard.user),
    action: 'ADMIN_PREREGISTRE_MODIFIE',
    module: ADMIN_AUDIT_MODULE,
    resource: administrateur.email,
    resourceId: administrateur.id,
    details: `Modification de ${administrateur.prenom} ${administrateur.nom} (${administrateur.email}) — activation prévue : ${administrateur.statutPrevu}.`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ administrateur });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin(request);
  if (!guard.ok) return guard.response;

  const existing = await prisma.adminPreRegistration.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, role: true, email: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Administrateur introuvable.' }, { status: 404 });
  }
  if (existing.user?.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Le compte Super Administrateur ne peut pas être révoqué.' }, { status: 403 });
  }
  if (existing.statut === 'REVOQUE') {
    return NextResponse.json({ error: 'Cette autorisation est déjà révoquée.' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.adminPreRegistration.update({
      where: { id: params.id },
      data: { statut: 'REVOQUE', revokedAt: new Date() },
    });
    if (existing.userId) {
      await tx.user.update({
        where: { id: existing.userId },
        data: { isActive: false, userStatus: 'DESACTIVE' },
      });
    }
  });

  await logAudit({
    ...auditActor(guard.user),
    action: 'ADMIN_AUTORISATION_REVOQUEE',
    module: ADMIN_AUDIT_MODULE,
    resource: existing.email,
    resourceId: existing.id,
    details: `Autorisation révoquée pour ${existing.email}${existing.userId ? ' — compte administrateur désactivé' : ''}.`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ ok: true, statut: 'REVOQUE' });
}
