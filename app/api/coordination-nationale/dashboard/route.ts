import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireNationalAccess } from '@/lib/national-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coordination-nationale/dashboard
 *
 * Tableau de bord national EC-ERC — agrégats de tout le pays.
 * Accès réservé au rôle exact COORDINATION_NATIONALE (vérifié côté serveur).
 *
 * Deux sources distinctes sont exposées sans être mélangées :
 *  - le registre réel (tables ecoles / eleves / enseignants) ;
 *  - le référentiel provincial (colonnes ecoles / eleves de la table provinces),
 *    déjà affiché par le tableau de bord national historique.
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;

  const [
    totalEcoles,
    totalEleves,
    totalEnseignants,
    totalCoordProvinciales,
    totalCoordSousProvinciales,
    totalProvinces,
    totalCoordinateurs,
    totalDocuments,
    totalRapports,
    provinces,
    presenceGroups,
    documentsRecents,
    activites,
  ] = await Promise.all([
    prisma.ecole.count(),
    prisma.eleve.count(),
    prisma.enseignant.count(),
    prisma.coordProvinciale.count(),
    prisma.coordSousProvinciale.count(),
    prisma.province.count(),
    prisma.user.count({ where: { role: 'COORDINATION_PROVINCIALE' } }),
    prisma.documentNational.count(),
    prisma.documentNational.count({ where: { type: 'RAPPORT_PROVINCIAL' } }),
    prisma.province.findMany({
      select: { nom: true, ecoles: true, eleves: true },
      orderBy: { nom: 'asc' },
    }),
    prisma.presence.groupBy({ by: ['statut'], _count: true }),
    prisma.documentNational.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, titre: true, reference: true,
        province: true, statut: true, createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, action: true, module: true, userName: true,
        result: true, createdAt: true,
      },
    }),
  ]);

  const presenceMap: Record<string, number> = {};
  for (const group of presenceGroups) {
    presenceMap[group.statut] = Number(group._count ?? 0);
  }
  const presents = presenceMap['PRESENT'] ?? 0;
  const retards = presenceMap['RETARD'] ?? 0;
  const absents = presenceMap['ABSENT'] ?? 0;
  const justifies = presenceMap['JUSTIFIE'] ?? 0;
  const totalPresences = presents + retards + absents + justifies;
  const taux = totalPresences > 0 ? Math.round((presents / totalPresences) * 100) : 0;

  return NextResponse.json({
    stats: {
      totalEcoles,
      totalEleves,
      totalEnseignants,
      totalCoordProvinciales,
      totalCoordSousProvinciales,
      totalProvinces,
      totalCoordinateurs,
      totalDocuments,
      totalRapports,
      ecolesReferentiel: provinces.reduce((sum, p) => sum + (p.ecoles ?? 0), 0),
      elevesReferentiel: provinces.reduce((sum, p) => sum + (p.eleves ?? 0), 0),
    },
    presences: { total: totalPresences, presents, retards, absents, justifies, taux },
    ecolesParProvince: provinces.map((p) => ({
      province: p.nom,
      ecoles: p.ecoles ?? 0,
      eleves: p.eleves ?? 0,
    })),
    documentsRecents,
    activites,
  });
}
