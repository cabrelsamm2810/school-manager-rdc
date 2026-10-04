import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { getScopeLevel } from '@/lib/territory-filter';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const scope = getScopeLevel(user.role);
  const prov = (user as any).provinceAdministrative || '';
  const sousProvId = (user as any).coordSousProvincialeId || '';
  const etabId = (user as any).etablissementId || '';

  // Filtre de périmètre hiérarchique
  let etabWhere: Record<string, unknown> = {};
  let eleveWhere: Record<string, unknown> = {};

  if (scope === 'national') {
    // Pas de filtre — accès national
  } else if (scope === 'sousProvincial' && sousProvId) {
    etabWhere = { coordSousProvincialeId: sousProvId };
    eleveWhere = { etablissement: { coordSousProvincialeId: sousProvId } };
  } else if (scope === 'school' && etabId) {
    etabWhere = { id: etabId };
    eleveWhere = { etablissementId: etabId };
  } else if (prov) {
    etabWhere = { province: prov };
    eleveWhere = { etablissement: { province: prov } };
  }

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
    scope: scope === 'national' ? 'national' : scope === 'sousProvincial' ? 'sousProvincial' : scope === 'school' ? 'school' : prov ? 'provincial' : 'global',
  });
}
