import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { isNationalScope } from '@/lib/territory-filter';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const national = isNationalScope(user.role);
  const prov = (user as any).provinceAdministrative || '';

  // Filtre de périmètre
  const etabWhere = national ? {} : (prov ? { province: prov } : {});
  const eleveWhere = national ? {} : (prov ? { etablissement: { province: prov } } : {});

  const [totalEleves, totalEtablissements, totalEnseignants, totalProvinces, totalClassesAgg, totalDossiers] = await Promise.all([
    prisma.eleve.count({ where: eleveWhere }),
    prisma.etablissement.count({ where: etabWhere }),
    prisma.enseignant.count(),
    prisma.province.count(),
    prisma.eleve.groupBy({ by: ['classe'], where: eleveWhere, _count: true }),
    prisma.dossier.count(),
  ]);

  const totalClasses = totalClassesAgg.length;

  // Activité récente (derniers dossiers et visites)
  const [recentDossiers, recentVisites] = await Promise.all([
    prisma.dossier.findMany({ take: 3, orderBy: { createdAt: 'desc' }, select: { objet: true, statut: true } }),
    prisma.visite.findMany({ take: 2, orderBy: { createdAt: 'desc' }, select: { etablissement: true, objet: true } }),
  ]);

  const activite = [
    ...recentDossiers.map((d) => `Dossier — ${d.objet} (${d.statut})`),
    ...recentVisites.map((v) => `Visite — ${v.etablissement}${v.objet ? ' : ' + v.objet : ''}`),
  ];

  return NextResponse.json({
    stats: {
      totalEleves,
      totalEtablissements,
      totalEnseignants,
      totalClasses,
      totalProvinces,
      totalDossiers,
    },
    activite: activite.slice(0, 5),
    scope: national ? 'national' : prov ? 'provincial' : 'global',
  });
}
