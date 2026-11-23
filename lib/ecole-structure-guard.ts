import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

/**
 * Contrôle d'accès commun aux routes de structure (sections & options)
 * d'un établissement : rôle minimum et isolation par école.
 */
export async function guardEcoleStructure(request: NextRequest, ecoleId: string) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return { error: NextResponse.json({ error: auth.error }, { status: 403 }) };
  }

  const user = auth.user as { role?: string; ecoleId?: string | null };
  if (user.role !== 'SUPER_ADMIN' && user.ecoleId && user.ecoleId !== ecoleId) {
    return { error: NextResponse.json({ error: 'Accès refusé : école différent.' }, { status: 403 }) };
  }

  const ecole = await prisma.ecole.findUnique({ where: { id: ecoleId }, select: { id: true } });
  if (!ecole) {
    return { error: NextResponse.json({ error: 'École introuvable.' }, { status: 404 }) };
  }

  return { user };
}
