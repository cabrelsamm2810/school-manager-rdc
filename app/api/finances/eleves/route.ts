import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { canFinance, FINANCE_PERM } from '@/lib/finance-permissions';

/**
 * GET /api/finances/eleves?q=…
 * Recherche manuelle d'un élève (nom, post-nom, prénom, matricule ou id) quand
 * le QR code de la carte scolaire ne peut pas être utilisé.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!canFinance(user, FINANCE_PERM.VIEW)) {
    return NextResponse.json({ error: 'Permission financière insuffisante.' }, { status: 403 });
  }

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ eleves: [] });
  }

  const eleves = await prisma.eleve.findMany({
    where: {
      ...buildEleveScopeWhere(user),
      OR: [
        { nom: { contains: q, mode: 'insensitive' } },
        { postNom: { contains: q, mode: 'insensitive' } },
        { prenom: { contains: q, mode: 'insensitive' } },
        { matricule: { contains: q, mode: 'insensitive' } },
        { id: q },
      ],
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      postNom: true,
      prenom: true,
      classe: true,
      ecole: { select: { nom: true } },
    },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    take: 25,
  });

  return NextResponse.json({
    eleves: eleves.map((eleve) => ({ ...eleve, ecole: eleve.ecole?.nom ?? null })),
  });
}
