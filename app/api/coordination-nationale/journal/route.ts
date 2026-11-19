import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireNationalAccess } from '@/lib/national-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coordination-nationale/journal
 * Historique des opérations consultable par le niveau national.
 * Lecture seule : aucune entrée d'audit ne peut être modifiée ni supprimée ici.
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);
  const action = searchParams.get('action')?.trim() || '';
  const module = searchParams.get('module')?.trim() || '';
  const result = searchParams.get('result')?.trim() || '';

  const where: Record<string, unknown> = {};
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (module) where.module = module;
  if (result) where.result = result;

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
