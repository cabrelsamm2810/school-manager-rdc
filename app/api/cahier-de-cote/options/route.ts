import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildScopeWhere } from '@/lib/territory-filter';

/** GET — options disponibles (classes, cours) pour le périmètre de l'utilisateur. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const scopeWhere = buildScopeWhere(auth.user, {
    etablissementField: 'etablissementId',
    provinceField: 'etablissementNom',
  });

  // Classes distinctes depuis les élèves
  const elevesWhere = { ...scopeWhere };
  const eleves = await prisma.eleve.findMany({
    where: elevesWhere,
    select: { classe: true },
    distinct: ['classe'],
    orderBy: { classe: 'asc' },
  });
  const classes = eleves.map((e) => e.classe).filter(Boolean);

  // Établissements (pour les rôles supérieurs)
  let etablissements: { id: string; nom: string }[] = [];
  if (auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'COORDINATION_NATIONALE' ||
      auth.user.role === 'COORDINATION_PROVINCIALE' || auth.user.role === 'AGENT_PROVINCIAL' ||
      auth.user.role === 'COORDINATION_SOUS_PROVINCIALE' || auth.user.role === 'AGENT_SOUS_PROVINCIAL') {
    const etabs = await prisma.etablissement.findMany({
      where: scopeWhere,
      select: { id: true, nom: true },
      orderBy: { nom: 'asc' },
    });
    etablissements = etabs;
  }

  return NextResponse.json({ classes, etablissements });
}
