import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { canFinance, FINANCE_PERM } from '@/lib/finance-permissions';
import { getEleveSituation } from '@/lib/frais-scolaires';

/** GET /api/finances/eleves/[id] — situation financière d'un élève. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!canFinance(user, FINANCE_PERM.VIEW)) {
    return NextResponse.json({ error: 'Permission financière insuffisante.' }, { status: 403 });
  }

  const scoped = await prisma.eleve.findFirst({
    where: { ...buildEleveScopeWhere(user), id: params.id },
    select: { id: true },
  });
  if (!scoped) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  const anneeScolaire = new URL(request.url).searchParams.get('anneeScolaire') ?? undefined;
  const situation = await getEleveSituation(params.id, anneeScolaire);
  if (!situation) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ situation });
}
