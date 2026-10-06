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
    // Pas de filtre territorial — accès national
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

  // ── Isolation par institution (appliquée après les filtres territoriaux) ──
  // SUPER_ADMIN voit tout ; les autres ne voient que leur institution.
  const userInst = (user as any).typeInstitution;
  if (user.role !== 'SUPER_ADMIN' && userInst) {
    etabWhere = { AND: [etabWhere, { institution: userInst }] };
    const existingEtabFilter = (eleveWhere.etablissement as Record<string, unknown>) || {};
    eleveWhere = { AND: [eleveWhere, { etablissement: { ...existingEtabFilter, institution: userInst } }] };
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
    prisma.coordSousProvinciale.count({
      where: {
        ...(scope === 'provincial' ? { province: prov } : {}),
        ...(userInst ? { institution: userInst } : {}),
      },
    }),
  ]);

  const totalClasses = totalClassesAgg.length;

  // ── Breakdown + chartData spécifiques au niveau ──
  let breakdown: { label: string; value: number; sublabel: string }[] = [];
  let chartData: { label: string; value: number }[] = [];

  if (scope === 'national') {
    const provinces = await prisma.province.findMany({ select: { nom: true, etablissements: true, eleves: true }, orderBy: { nom: 'asc' } });
    breakdown = provinces.map((p) => ({ label: p.nom, value: p.etablissements, sublabel: `${p.eleves} élèves` }));
    chartData = provinces.map((p) => ({ label: p.nom, value: p.eleves }));
  } else if (scope === 'provincial' && prov) {
    const sousProvs = await prisma.coordSousProvinciale.findMany({
      where: { province: prov, ...(userInst ? { institution: userInst } : {}) },
      select: { id: true, nom: true },
      orderBy: { nom: 'asc' },
    });
    const results = await Promise.all(
      sousProvs.map(async (sp) => {
        const nbEtab = await prisma.etablissement.count({ where: { coordSousProvincialeId: sp.id, ...(userInst ? { institution: userInst } : {}) } });
        const nbEleves = await prisma.eleve.count({ where: { etablissement: { coordSousProvincialeId: sp.id, ...(userInst ? { institution: userInst } : {}) } } });
        return { label: sp.nom, nbEtab, nbEleves };
      }),
    );
    breakdown = results.map((r) => ({ label: r.label, value: r.nbEtab, sublabel: `${r.nbEleves} élèves` }));
    chartData = results.map((r) => ({ label: r.label, value: r.nbEleves }));
  } else if (scope === 'sousProvincial' && sousProvId) {
    const etabs = await prisma.etablissement.findMany({
      where: { coordSousProvincialeId: sousProvId, ...(userInst ? { institution: userInst } : {}) },
      select: { id: true, nom: true, type: true },
      orderBy: { nom: 'asc' },
    });
    const results = await Promise.all(
      etabs.map(async (e) => {
        const nbEleves = await prisma.eleve.count({ where: { etablissementId: e.id } });
        return { label: e.nom, nbEleves, type: e.type || 'Établissement' };
      }),
    );
    breakdown = results.map((r) => ({ label: r.label, value: r.nbEleves, sublabel: r.type }));
    chartData = results.map((r) => ({ label: r.label, value: r.nbEleves }));
  } else if (scope === 'school' && etabId) {
    breakdown = totalClassesAgg.map((c) => ({ label: c.classe, value: c._count, sublabel: 'élèves' }));
    chartData = totalClassesAgg.map((c) => ({ label: c.classe, value: c._count }));
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
    chartData,
    activite: activite.slice(0, 5),
    scope,
    provinceLabel: prov || null,
  });
}
