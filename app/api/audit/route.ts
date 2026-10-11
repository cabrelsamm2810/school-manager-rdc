import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can } from '@/lib/permissions';
import { PERM } from '@/lib/permissions';

/**
 * API du journal d'audit — School Manager RDC.
 *
 * GET /api/audit — liste des entrées d'audit (paginée).
 * Seuls les rôles avec la permission ADMIN_AUDIT_VIEW peuvent consulter.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  if (!can(user.role, PERM.ADMIN_AUDIT_VIEW)) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const offset = Number(searchParams.get('offset') ?? 0);
  const action = searchParams.get('action') ?? undefined;
  const module = searchParams.get('module') ?? undefined;

  const where: Record<string, unknown> = {};
  if (action) where.action = { contains: action };
  if (module) where.module = module;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ entries, total, limit, offset });
}
