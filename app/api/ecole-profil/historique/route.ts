import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { loadEcoleAutorisee, type ProfilUtilisateur } from '@/lib/ecole-profil-service';

/** GET /api/ecole-profil/historique — dernières modifications administratives. */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const ecoleId = new URL(request.url).searchParams.get('ecoleId');
  const cible = await loadEcoleAutorisee(user, ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });

  const historique = await prisma.ecoleProfilHistorique.findMany({
    where: { ecoleId: cible.ecole.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ historique });
}
