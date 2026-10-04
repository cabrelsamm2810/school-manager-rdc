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

  // ── Filtres de périmètre hiérarchique ──
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

  // ── Stats de base (communes à tous les niveaux) ──
  const [totalEleves, totalEtablissements, totalEnseignants, totalProvinces, totalClassesAgg, totalDossiers, totalVisites, totalSousProvinciales] = await Promise.all([
    prisma.eleve.count({ where: eleveWhere }),
    prisma.etablissement.count({ where: etabWhere }),
    prisma.enseignant.count(),
    prisma.province.count(),
    prisma.eleve.groupBy({ by: ['classe'], where: eleveWhere, _count: true }),
    prisma.dossier.count(),
    prisma.visite.count(),
    prisma.coordSousProvinciale.count(scope === 'provincial' ? { where: { province: prov } } : {}),
  ]);

  const totalClasses = totalClassesAgg.length;

  // ── Breakdown spécifique au niveau ──
  let breakdown: { label: string; value: number; sublabel: string }[] = [];

  if (scope === 'national') {
    // Répartition par province
    const provinces = await prisma.province.findMany({ select: { nom: true, etablissements: true, eleves: true }, orderBy: { nom: 'asc' } });
    breakdown = provinces.map((p) => ({
      label: p.nom,
      value: p.etablissements,
      sublabel: `${p.eleves} élèves`,
    }));
  } else if (scope === 'provincial' && prov) {
    // Répartition par sous-division de la province
    const sousProvs = await prisma.coordSousProvinciale.findMany({
      where: { province: prov },
      select: { id: true, nom: true, bureaux: true, agents: true },
      orderBy: { nom: 'asc' },
    });
    breakdown = await Promise.all(
      sousProvs.map(async (sp) => {
        const nbEtab = await prisma.etablissement.count({ where: { coordSousProvincialeId: sp.id } });
        const nbEleves = await prisma.eleve.count({ where: { etablissement: { coordSousProvincialeId: sp.id } } });
        return { label: sp.nom, value: nbEtab, sublabel: `${nbEleves} élèves` };
      }),
    );
  } else if (scope === 'sousProvincial' && sousProvId) {
    // Répartition par établissement de la sous-division
    const etabs = await prisma.etablissement.findMany({
      where: { coordSousProvincialeId: sousProvId },
      select: { id: true, nom: true, type: true, effectif: true },
      orderBy: { nom: 'asc' },
    });
    breakdown = await Promise.all(
      etabs.map(async (e) => {
        const nbEleves = await prisma.eleve.count({ where: { etablissementId: e.id } });
        return { label: e.nom, value: nbEleves, sublabel: e.type || 'Établissement' };
      }),
    );
  } else if (scope === 'school' && etabId) {
    // Répartition par classe de l'établissement
    breakdown = totalClassesAgg.map((c) => ({
      label: c.classe,
      value: c._count,
      sublabel: 'élèves',
    }));
  }

  // ── Activité récente ──
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
      totalVisites,
      totalSousProvinciales,
    },
    breakdown,
    activite: activite.slice(0, 5),
    scope,
    provinceLabel: prov || null,
  });
}
