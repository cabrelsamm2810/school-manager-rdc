import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin-smd/stats
 *
 * Statistiques agrégées pour le tableau de bord Admin School Manager RDC.
 * Toutes les données proviennent exclusivement de la base — aucune valeur fictive.
 *
 * Permission requise : ADMIN_SCHOOL_MANAGER_RDC (vérifiée via can(role, PERM.ADMIN_STATS)).
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ADMIN_SCHOOL_MANAGER_RDC') {
    return NextResponse.json({ error: 'Accès réservé à l\'Admin School Manager RDC.' }, { status: 403 });
  }
  if (!can(user.role, PERM.ADMIN_STATS)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  // ── Statistiques utilisateurs ──
  const [
    totalUsers, activeUsers, pendingUsers, suspendedUsers,
    usersByRoleRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.groupBy({ by: ['role'], _count: true, orderBy: { _count: { role: 'desc' } } }),
  ]);

  // ── Statistiques établissements ──
  const [
    totalEcoles, activeEcoles, pendingEcoles, suspendedEcoles,
    ecolesByProvinceRaw, ecolesByTypeRaw,
  ] = await Promise.all([
    prisma.ecole.count(),
    prisma.ecole.count({ where: { statut: 'Actif' } }),
    prisma.ecole.count({ where: { statutValidation: 'En attente' } }),
    prisma.ecole.count({ where: { statut: 'Suspendu' } }),
    prisma.ecole.groupBy({ by: ['province'], _count: true, orderBy: { _count: { province: 'desc' } } }),
    prisma.ecole.groupBy({ by: ['type'], _count: true, orderBy: { _count: { type: 'desc' } } }),
  ]);

  // ── Statistiques dossiers ──
  const [
    totalDossiers, pendingDossiers, processedDossiers, newDossiers,
    recentDossiers,
  ] = await Promise.all([
    prisma.dossier.count(),
    prisma.dossier.count({ where: { statut: 'En attente' } }),
    prisma.dossier.count({ where: { statut: 'Traité' } }),
    prisma.dossier.count({ where: { statut: 'Nouveau' } }),
    prisma.dossier.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: { id: true, reference: true, objet: true, statut: true, demandeur: true, createdAt: true },
    }),
  ]);

  // ── Signalements (notifications de type signalement) ──
  const [
    newSignalements, inProgressSignalements, resolvedSignalements,
  ] = await Promise.all([
    prisma.notification.count({ where: { type: { contains: 'signalement', mode: 'insensitive' }, lu: false } }),
    prisma.notification.count({ where: { type: { contains: 'signalement', mode: 'insensitive' }, lu: true } }),
    prisma.notification.count({ where: { type: { contains: 'resolu', mode: 'insensitive' } } }),
  ]);

  // ── Service client (ServiceAdmin) ──
  const serviceAdmins = await prisma.serviceAdmin.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, service: true, procedures: true, dossiers: true, statut: true },
  });

  // ── Notifications non lues ──
  const unreadNotifications = await prisma.notification.count({ where: { lu: false } });
  const recentNotifications = await prisma.notification.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: { id: true, titre: true, message: true, type: true, lu: true, createdAt: true },
  });

  // ── Journal d'audit ──
  const [auditEntries, auditTotal] = await Promise.all([
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, userName: true, userRole: true, action: true,
        module: true, result: true, createdAt: true,
      },
    }),
    prisma.auditLog.count(),
  ]);

  // ── Activités récentes (audit + dossiers récents) ──
  const recentActivities = auditEntries.slice(0, 8).map((e) => ({
    id: e.id,
    user: e.userName || 'Système',
    role: e.userRole || '—',
    action: e.action,
    module: e.module || '—',
    date: e.createdAt.toISOString(),
    status: e.result || 'success',
  }));

  return NextResponse.json({
    users: {
      total: totalUsers,
      active: activeUsers,
      pending: pendingUsers,
      suspended: suspendedUsers,
      byRole: usersByRoleRaw.map((r) => ({ role: r.role, count: r._count })),
    },
    ecoles: {
      total: totalEcoles,
      active: activeEcoles,
      pending: pendingEcoles,
      suspended: suspendedEcoles,
      byProvince: ecolesByProvinceRaw
        .filter((p) => p.province)
        .map((p) => ({ province: p.province, count: p._count })),
      byType: ecolesByTypeRaw
        .filter((t) => t.type)
        .map((t) => ({ type: t.type, count: t._count })),
    },
    dossiers: {
      total: totalDossiers,
      pending: pendingDossiers,
      processed: processedDossiers,
      new: newDossiers,
      recent: recentDossiers,
    },
    signalements: {
      new: newSignalements,
      inProgress: inProgressSignalements,
      resolved: resolvedSignalements,
    },
    serviceClient: serviceAdmins,
    notifications: {
      unread: unreadNotifications,
      recent: recentNotifications,
    },
    audit: {
      entries: auditEntries,
      total: auditTotal,
    },
    activities: recentActivities,
  });
}
