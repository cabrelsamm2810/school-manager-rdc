import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin-smd/ecoles/[id] — fiche détaillée d'un établissement.
 *
 * Inclut les statistiques réelles (élèves, enseignants, classes, utilisateurs),
 * les responsables liés, l'historique de validation et les documents.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!can(currentUser.role, PERM.ADMIN_ECOLES)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  const ecole = await prisma.ecole.findUnique({
    where: { id: params.id },
    include: {
      coordSousProvinciale: { select: { id: true, nom: true, province: true } },
      ecErc: { select: { id: true, nom: true, type: true } },
      documents: { orderBy: { createdAt: 'desc' }, take: 20 },
      validationLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { eleves: true, enseignants: true, users: true, chatGroups: true } },
    },
  });

  if (!ecole) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  // Responsables liés à cet établissement
  const responsables = await prisma.user.findMany({
    where: {
      ecoleId: params.id,
      role: { in: ['DIRECTION_ECOLE', 'PROMOTEUR', 'SECRETAIRE', 'COMPTABLE'] },
    },
    select: {
      id: true, nom: true, postNom: true, prenom: true, role: true,
      email: true, telephone: true, fonction: true, grade: true,
      userStatus: true, isActive: true,
    },
    orderBy: [{ role: 'asc' }, { nom: 'asc' }],
  });

  // Utilisateurs liés (tous rôles confondus)
  const totalUsers = await prisma.user.count({ where: { ecoleId: params.id } });

  // Classes distinctes (via les élèves)
  const classes = await prisma.eleve.findMany({
    where: { ecoleId: params.id },
    select: { classe: true },
    distinct: ['classe'],
    orderBy: { classe: 'asc' },
  });

  return NextResponse.json({
    ecole: {
      ...ecole,
      stats: {
        eleves: ecole._count.eleves,
        enseignants: ecole._count.enseignants,
        utilisateurs: totalUsers,
        classes: classes.filter((c) => c.classe).map((c) => c.classe),
        chatGroups: ecole._count.chatGroups,
      },
      responsables,
    },
  });
}
