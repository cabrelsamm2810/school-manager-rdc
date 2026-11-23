import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import {
  canEditEcoleProfil,
  ensureEcoleProfil,
  loadEcoleAutorisee,
  type ProfilUtilisateur,
} from '@/lib/ecole-profil-service';

/**
 * GET /api/ecole-profil/chefs — comptes « Chef d'établissement » pouvant être
 * associés à l'école : ceux déjà rattachés à cette école, plus les comptes du
 * même réseau institutionnel encore sans école. Aucun compte d'une autre école
 * n'est exposé.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const ecoleId = new URL(request.url).searchParams.get('ecoleId');
  const cible = await loadEcoleAutorisee(user, ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });
  if (!canEditEcoleProfil(user, cible.ecole)) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const profil = await ensureEcoleProfil(cible.ecole.id, cible.ecole.institution, user);
  const chefs = await prisma.user.findMany({
    where: {
      role: 'DIRECTION_ECOLE',
      isActive: true,
      OR: [
        { ecoleId: cible.ecole.id },
        { ecoleId: null, typeInstitution: cible.ecole.institution },
        ...(profil.chefUserId ? [{ id: profil.chefUserId }] : []),
      ],
    },
    select: { id: true, nom: true, postNom: true, prenom: true, email: true },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
  });

  return NextResponse.json({ chefs, chefUserId: profil.chefUserId });
}
