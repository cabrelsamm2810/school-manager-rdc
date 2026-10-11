import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildEleveScopeWhere, buildScopeWhere } from '@/lib/territory-filter';

/** GET — options disponibles (classes, cours) pour le périmètre de l'utilisateur. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  // Classes distinctes depuis les élèves. `Eleve` n'a ni `province` ni `institution` :
  // le périmètre passe par la relation `ecole`.
  const eleves = await prisma.eleve.findMany({
    where: buildEleveScopeWhere(auth.user),
    select: { classe: true },
    distinct: ['classe'],
    orderBy: { classe: 'asc' },
  });
  const classes = eleves.map((e) => e.classe).filter(Boolean);

  // Écoles (pour les rôles supérieurs) — champs propres au modèle Ecole.
  let ecoles: { id: string; nom: string }[] = [];
  if (auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'COORDINATION_NATIONALE' ||
      auth.user.role === 'COORDINATION_PROVINCIALE' || auth.user.role === 'AGENT_PROVINCIAL' ||
      auth.user.role === 'COORDINATION_SOUS_PROVINCIALE' || auth.user.role === 'AGENT_SOUS_PROVINCIAL') {
    const etabs = await prisma.ecole.findMany({
      where: buildScopeWhere(auth.user, {
        provinceField: 'province',
        institutionField: 'institution',
        ecoleField: 'id',
      }),
      select: { id: true, nom: true },
      orderBy: { nom: 'asc' },
    });
    ecoles = etabs;
  }

  return NextResponse.json({ classes, ecoles });
}
