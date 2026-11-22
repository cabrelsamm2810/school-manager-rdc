import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireNationalPermission, nationalProfile } from '@/lib/national-access';
import { PERM } from '@/lib/permissions';

/** Institution supervisée par la Coordination nationale EC-ERC. */
const INSTITUTION = 'EC_ERC';

/**
 * GET /api/coordination-nationale/tableau-de-bord
 *
 * Toutes les valeurs proviennent de la base de données, filtrées sur les
 * établissements EC-ERC. Aucun chiffre n'est simulé : une base vide renvoie
 * des zéros.
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalPermission(request, PERM.NATIONAL_DASHBOARD);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ecoleWhere = { institution: INSTITUTION };

  const [ecoles, elevesParEcole, totalEnseignants, coordinationsProvinciales, coordinationsSousProvinciales, notifications, unread, recentDossiers, recentVisites] =
    await Promise.all([
      prisma.ecole.findMany({
        where: ecoleWhere,
        select: { id: true, province: true, provinceEducationnelle: true },
      }),
      prisma.eleve.groupBy({
        by: ['ecoleId'],
        where: { ecole: { institution: INSTITUTION } },
        _count: { _all: true },
      }),
      prisma.enseignant.count({ where: { ecoleRattachee: { institution: INSTITUTION } } }),
      prisma.coordProvinciale.count({ where: { institution: INSTITUTION } }),
      prisma.coordSousProvinciale.count({ where: { institution: INSTITUTION } }),
      prisma.notification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, titre: true, message: true, type: true, lu: true, createdAt: true },
      }),
      prisma.notification.count({ where: { lu: false } }),
      prisma.dossier.findMany({ take: 3, orderBy: { createdAt: 'desc' }, select: { objet: true, statut: true } }),
      prisma.visite.findMany({ take: 3, orderBy: { createdAt: 'desc' }, select: { ecole: true, objet: true } }),
    ]);

  const ecoleIds = ecoles.map((e) => e.id);
  const ecoleById = new Map(ecoles.map((e) => [e.id, e]));

  // ── Élèves par école (regroupés ensuite par province) ──
  let totalEleves = 0;
  const provinceMap = new Map<string, { province: string; ecoles: number; eleves: number }>();

  for (const ecole of ecoles) {
    const key = ecole.province || 'Non renseignée';
    const entry = provinceMap.get(key) ?? { province: key, ecoles: 0, eleves: 0 };
    entry.ecoles += 1;
    provinceMap.set(key, entry);
  }

  for (const group of elevesParEcole) {
    const count = group._count._all;
    totalEleves += count;
    if (!group.ecoleId) continue;
    const ecole = ecoleById.get(group.ecoleId);
    if (!ecole) continue;
    const key = ecole.province || 'Non renseignée';
    const entry = provinceMap.get(key) ?? { province: key, ecoles: 0, eleves: 0 };
    entry.eleves += count;
    provinceMap.set(key, entry);
  }

  // ── Écoles par province éducationnelle ──
  const educMap = new Map<string, number>();
  for (const ecole of ecoles) {
    const key = ecole.provinceEducationnelle || 'Non renseignée';
    educMap.set(key, (educMap.get(key) ?? 0) + 1);
  }
  const ecolesParProvinceEduc = [...educMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // ── Présences des 30 derniers jours ──
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const presenceWhere = ecoleIds.length > 0 ? { date: { gte: since }, ecoleId: { in: ecoleIds } } : { date: { gte: since } };

  const [presenceGroups, seances30j] = await Promise.all([
    prisma.presence.groupBy({ by: ['statut'], where: presenceWhere, _count: { _all: true } }),
    prisma.seancePresence.count({
      where: ecoleIds.length > 0 ? { date: { gte: since }, ecoleId: { in: ecoleIds } } : { date: { gte: since } },
    }),
  ]);

  const presences = presenceGroups
    .map((g) => ({ label: g.statut, value: g._count._all }))
    .sort((a, b) => b.value - a.value);
  const presenceTotal = presences.reduce((sum, p) => sum + p.value, 0);
  const presencePresent = presences
    .filter((p) => p.label === 'PRESENT' || p.label === 'RETARD' || p.label === 'JUSTIFIE')
    .reduce((sum, p) => sum + p.value, 0);
  const presenceRate = presenceTotal > 0 ? Math.round((presencePresent / presenceTotal) * 100) : null;

  // ── Activité récente (données réelles) ──
  const activite = [
    ...recentDossiers.map((d) => `Dossier — ${d.objet} (${d.statut})`),
    ...recentVisites.map((v) => `Visite — ${v.ecole}${v.objet ? ' : ' + v.objet : ''}`),
  ];

  const provinces = [...provinceMap.values()].sort((a, b) => b.ecoles - a.ecoles);

  return NextResponse.json({
    profil: nationalProfile(auth.user),
    stats: {
      totalEcoles: ecoles.length,
      totalEleves,
      totalEnseignants,
      coordinationsProvinciales,
      coordinationsSousProvinciales,
      provincesCouvertes: provinces.filter((p) => p.ecoles > 0).length,
      seances30j,
      presenceTaux: presenceRate,
      notificationsNonLues: unread,
    },
    ecolesParProvinceEduc,
    provinces,
    presences,
    activite,
    notifications: notifications.map((n) => ({
      id: n.id,
      titre: n.titre,
      message: n.message,
      type: n.type,
      lu: n.lu,
      createdAt: n.createdAt,
    })),
  });
}
