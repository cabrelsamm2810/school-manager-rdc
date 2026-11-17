import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit, getClientIP } from '@/lib/audit';
import { auditActor, requireSuperAdmin } from '@/lib/admin-management';
import {
  ADMIN_AUDIT_MODULE,
  ADMIN_ROLE,
  adminPreRegistrationSchema,
  normalizeEmail,
} from '@/lib/admin-registration';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/administrateurs — allowlist des administrateurs School Manager RDC.
 *
 * Recherche (`search`), filtre d'état (`statut`), pagination. Réservé au
 * SUPER_ADMIN : aucune donnée n'est exposée à un autre rôle.
 */
export async function GET(request: NextRequest) {
  const guard = await requireSuperAdmin(request);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const statut = searchParams.get('statut') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  const where: Record<string, unknown> = {};
  if (statut && ['EN_ATTENTE', 'COMPTE_CREE', 'REVOQUE'].includes(statut)) where.statut = statut;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { nom: { contains: search, mode: 'insensitive' } },
      { postNom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [administrateurs, total, allCount, grouped, recentActivity] = await Promise.all([
    prisma.adminPreRegistration.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, email: true, nom: true, postNom: true, prenom: true, telephone: true,
        role: true, statut: true, statutPrevu: true, createdAt: true, updatedAt: true,
        revokedAt: true, userId: true,
        user: { select: { id: true, isActive: true, userStatus: true, role: true, createdAt: true } },
        createdBy: { select: { nom: true, prenom: true } },
      },
    }),
    prisma.adminPreRegistration.count({ where }),
    prisma.adminPreRegistration.count(),
    prisma.adminPreRegistration.groupBy({ by: ['statut'], _count: true }),
    prisma.auditLog.findMany({
      where: { module: ADMIN_AUDIT_MODULE },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, userName: true, action: true, result: true, details: true, createdAt: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of grouped) counts[row.statut] = row._count;

  return NextResponse.json({
    administrateurs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      total: allCount,
      enAttente: counts['EN_ATTENTE'] ?? 0,
      compteCree: counts['COMPTE_CREE'] ?? 0,
      revoque: counts['REVOQUE'] ?? 0,
    },
    recentActivity,
  });
}

/**
 * POST /api/admin/administrateurs — préenregistrer une adresse Gmail.
 *
 * Le rôle est toujours ADMIN_SCHOOL_MANAGER_RDC et l'état initial EN_ATTENTE :
 * ces valeurs ne viennent jamais du navigateur.
 */
export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin(request);
  if (!guard.ok) return guard.response;

  const parsed = adminPreRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);

  const [duplicate, existingUser] = await Promise.all([
    prisma.adminPreRegistration.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } }),
    prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } }),
  ]);
  if (duplicate) {
    return NextResponse.json({ error: 'Cette adresse Gmail est déjà préenregistrée.' }, { status: 409 });
  }
  if (existingUser) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse Gmail.' }, { status: 409 });
  }

  const created = await prisma.adminPreRegistration.create({
    data: {
      email,
      nom: parsed.data.nom,
      postNom: parsed.data.postNom ?? '',
      prenom: parsed.data.prenom,
      telephone: parsed.data.telephone ?? '',
      role: ADMIN_ROLE,
      statutPrevu: parsed.data.statutPrevu,
      statut: 'EN_ATTENTE',
      createdById: guard.user.id,
    },
    select: { id: true, email: true, nom: true, postNom: true, prenom: true, statut: true, statutPrevu: true },
  });

  await logAudit({
    ...auditActor(guard.user),
    action: 'ADMIN_PREREGISTRE_CREE',
    module: ADMIN_AUDIT_MODULE,
    resource: email,
    resourceId: created.id,
    details: `Préenregistrement de ${created.prenom} ${created.nom} (${email}) — activation prévue : ${created.statutPrevu}.`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ administrateur: created }, { status: 201 });
}
