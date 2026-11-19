import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireNationalAccess } from '@/lib/national-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coordination-nationale/supervision
 *
 * Supervision nationale : coordinations provinciales, coordinations
 * sous-provinciales (avec leurs effectifs et leurs coordinateurs),
 * établissements du registre et activités nationales récentes.
 * Accès réservé au rôle exact COORDINATION_NATIONALE.
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;

  const [
    coordinationsProvinciales,
    coordinationsSousProvinciales,
    ecoleRows,
    eleveGroups,
    coordinateursProvinciaux,
    coordinateursSousProvinciaux,
    ecoles,
    activites,
  ] = await Promise.all([
    prisma.coordProvinciale.findMany({
      orderBy: { province: 'asc' },
      select: {
        id: true, province: true, institution: true,
        bureaux: true, agents: true, dossiers: true, statut: true,
      },
    }),
    prisma.coordSousProvinciale.findMany({
      orderBy: [{ province: 'asc' }, { nom: 'asc' }],
      select: {
        id: true, nom: true, province: true, institution: true,
        bureaux: true, agents: true, statut: true,
        coordProvinciale: { select: { province: true } },
      },
    }),
    prisma.ecole.findMany({
      select: { id: true, province: true, coordSousProvincialeId: true },
    }),
    prisma.eleve.groupBy({ by: ['ecoleId'], _count: true }),
    prisma.user.groupBy({
      by: ['provinceAdministrative'],
      where: { role: 'COORDINATION_PROVINCIALE' },
      _count: true,
    }),
    prisma.user.groupBy({
      by: ['coordSousProvincialeId'],
      where: { role: 'COORDINATION_SOUS_PROVINCIALE' },
      _count: true,
    }),
    prisma.ecole.findMany({
      take: 200,
      orderBy: { nom: 'asc' },
      select: {
        id: true, nom: true, type: true, province: true,
        commune: true, statutValidation: true, effectif: true,
      },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, action: true, module: true, userName: true,
        result: true, details: true, createdAt: true,
      },
    }),
  ]);

  // Index des établissements pour rattacher les élèves à leur province / sous-coordination.
  const ecoleById = new Map(ecoleRows.map((e) => [e.id, e]));

  const ecolesParProvince = new Map<string, number>();
  const ecolesParSousCoordination = new Map<string, number>();
  const elevesParProvince = new Map<string, number>();
  const elevesParSousCoordination = new Map<string, number>();

  for (const ecole of ecoleRows) {
    if (ecole.province) {
      ecolesParProvince.set(ecole.province, (ecolesParProvince.get(ecole.province) ?? 0) + 1);
    }
    if (ecole.coordSousProvincialeId) {
      ecolesParSousCoordination.set(
        ecole.coordSousProvincialeId,
        (ecolesParSousCoordination.get(ecole.coordSousProvincialeId) ?? 0) + 1,
      );
    }
  }

  for (const group of eleveGroups) {
    const ecole = group.ecoleId ? ecoleById.get(group.ecoleId) : undefined;
    if (!ecole) continue;
    const count = Number(group._count ?? 0);
    if (ecole.province) {
      elevesParProvince.set(ecole.province, (elevesParProvince.get(ecole.province) ?? 0) + count);
    }
    if (ecole.coordSousProvincialeId) {
      elevesParSousCoordination.set(
        ecole.coordSousProvincialeId,
        (elevesParSousCoordination.get(ecole.coordSousProvincialeId) ?? 0) + count,
      );
    }
  }

  const coordinateursParProvince = new Map<string, number>();
  for (const group of coordinateursProvinciaux) {
    coordinateursParProvince.set(group.provinceAdministrative || '', Number(group._count ?? 0));
  }

  const coordinateursParSousCoordination = new Map<string, number>();
  for (const group of coordinateursSousProvinciaux) {
    if (group.coordSousProvincialeId) {
      coordinateursParSousCoordination.set(group.coordSousProvincialeId, Number(group._count ?? 0));
    }
  }

  return NextResponse.json({
    coordinationsProvinciales: coordinationsProvinciales.map((c) => ({
      ...c,
      ecoles: ecolesParProvince.get(c.province) ?? 0,
      eleves: elevesParProvince.get(c.province) ?? 0,
      coordinateurs: coordinateursParProvince.get(c.province) ?? 0,
    })),
    coordinationsSousProvinciales: coordinationsSousProvinciales.map((c) => ({
      ...c,
      provinceParente: c.coordProvinciale?.province ?? '',
      ecoles: ecolesParSousCoordination.get(c.id) ?? 0,
      eleves: elevesParSousCoordination.get(c.id) ?? 0,
      coordinateurs: coordinateursParSousCoordination.get(c.id) ?? 0,
    })),
    ecoles,
    activites,
  });
}
