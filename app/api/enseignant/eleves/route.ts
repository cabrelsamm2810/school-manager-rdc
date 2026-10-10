import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';

/**
 * GET /api/enseignant/eleves — lecture seule des élèves du périmètre de
 * l'enseignant (filtrable par classe).
 *
 * Même règle exacte que la page et `/api/enseignant/dashboard` : réservé au
 * rôle ENSEIGNANT. `/api/eleves` (module de gestion) reste fermé à ce rôle ;
 * cet endpoint ne donne que le minimum nécessaire aux outils de présence.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Espace réservé au rôle enseignant.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classe = searchParams.get('classe') || undefined;

  const where: Record<string, unknown> = buildEleveScopeWhere(user);
  if (classe) where.classe = classe;

  const eleves = await prisma.eleve.findMany({
    where,
    select: { id: true, matricule: true, nom: true, postNom: true, prenom: true, classe: true },
    orderBy: [{ classe: 'asc' }, { nom: 'asc' }],
  });

  return NextResponse.json({ eleves });
}
