import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';
import { INSTITUTIONS } from '@/lib/institutions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin-smd/ecoles — liste paginée des établissements.
 *
 * Permission requise : ADMIN_ECOLES (Admin School Manager RDC).
 * Recherche multi-champs, filtres combinables (type, statut, province,
 * province éducationnelle, niveau), pagination, et statistiques agrégées.
 */
export async function GET(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!can(currentUser.role, PERM.ADMIN_ECOLES)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const typeFilter = searchParams.get('type') || '';
  const statutFilter = searchParams.get('statut') || '';
  const statutValidationFilter = searchParams.get('statutValidation') || '';
  const provinceFilter = searchParams.get('province') || '';
  const provinceEducFilter = searchParams.get('provinceEducationnelle') || '';
  const communeFilter = searchParams.get('commune') || '';
  const niveauFilter = searchParams.get('niveau') || '';
  const institutionFilter = searchParams.get('institution') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  // ── Construction du where ──
  const where: Record<string, unknown> = {};

  if (typeFilter) where.type = typeFilter;
  if (statutFilter) where.statut = statutFilter;
  if (statutValidationFilter) where.statutValidation = statutValidationFilter;
  if (provinceFilter) where.province = provinceFilter;
  if (provinceEducFilter) where.provinceEducationnelle = provinceEducFilter;
  if (communeFilter) where.commune = communeFilter;
  if (niveauFilter) where.type = niveauFilter; // niveau scolaire stocké dans `type`
  if (institutionFilter) where.institution = institutionFilter;

  // Recherche multi-champs
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { dinacope: { contains: search, mode: 'insensitive' } },
      { adresse: { contains: search, mode: 'insensitive' } },
      { commune: { contains: search, mode: 'insensitive' } },
      { ville: { contains: search, mode: 'insensitive' } },
      { province: { contains: search, mode: 'insensitive' } },
      { provinceEducationnelle: { contains: search, mode: 'insensitive' } },
      { chefEcole: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { identifiantSM: { contains: search, mode: 'insensitive' } },
    ];
  }

  // ── Requêtes parallèles : liste + total + stats ──
  const [ecoles, total] = await Promise.all([
    prisma.ecole.findMany({
      where,
      select: {
        id: true, nom: true, type: true, institution: true, dinacope: true,
        province: true, provinceEducationnelle: true, ville: true, commune: true,
        adresse: true, telephone: true, email: true, chefEcole: true,
        logoUrl: true, identifiantSM: true, effectif: true,
        statut: true, statutValidation: true, createdAt: true, updatedAt: true,
        coordSousProvincialeId: true, ecErcId: true,
        coordSousProvinciale: { select: { id: true, nom: true } },
        ecErc: { select: { id: true, nom: true } },
        _count: { select: { eleves: true, enseignants: true, users: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ecole.count({ where }),
  ]);

  // ── Statistiques agrégées (sur l'ensemble des écoles, pas seulement la page) ──
  const [
    totalEcoles, activeEcoles, pendingEcoles, suspendedEcoles,
    byProvinceRaw, byTypeRaw, byInstitutionRaw,
  ] = await Promise.all([
    prisma.ecole.count(),
    prisma.ecole.count({ where: { statut: 'Actif' } }),
    prisma.ecole.count({ where: { statutValidation: { in: ['En attente de vérification', 'En cours de vérification', 'Brouillon'] } } }),
    prisma.ecole.count({ where: { statut: 'Suspendu' } }),
    prisma.ecole.groupBy({ by: ['province'], _count: true, orderBy: { _count: { province: 'desc' } } }),
    prisma.ecole.groupBy({ by: ['type'], _count: true, orderBy: { _count: { type: 'desc' } } }),
    prisma.ecole.groupBy({ by: ['institution'], _count: true, orderBy: { _count: { institution: 'desc' } } }),
  ]);

  // Listes distinctes pour les filtres
  const allProvinces = await prisma.ecole.findMany({
    where: { province: { not: '' } },
    select: { province: true },
    distinct: ['province'],
    orderBy: { province: 'asc' },
  });
  const allProvincesEduc = await prisma.ecole.findMany({
    where: { provinceEducationnelle: { not: '' } },
    select: { provinceEducationnelle: true },
    distinct: ['provinceEducationnelle'],
    orderBy: { provinceEducationnelle: 'asc' },
  });

  return NextResponse.json({
    ecoles,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      total: totalEcoles,
      actifs: activeEcoles,
      enAttente: pendingEcoles,
      suspendus: suspendedEcoles,
      byProvince: byProvinceRaw.filter((p) => p.province).map((p) => ({ province: p.province, count: p._count })),
      byType: byTypeRaw.filter((t) => t.type).map((t) => ({ type: t.type, count: t._count })),
      byInstitution: byInstitutionRaw.map((i) => ({ institution: i.institution, count: i._count })),
    },
    filters: {
      provinces: allProvinces.map((p) => p.province),
      provincesEducationnelles: allProvincesEduc.map((p) => p.provinceEducationnelle),
      institutions: INSTITUTIONS.map((i) => ({ code: i.code, label: i.label })),
    },
  });
}
