import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';
import { RESTRICTED_ROLES } from '@/lib/roles';
import { hashPassword } from '@/lib/auth';
import { logAudit, getClientIP } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** Rôles que l'Admin SMD peut créer / assigner (exclut SUPER_ADMIN et ADMIN_SCHOOL_MANAGER_RDC). */
const MANAGEABLE_ROLES = [
  'COORDINATION_NATIONALE', 'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL',
  'PROMOTEUR', 'DIRECTION_ECOLE', 'SECRETAIRE', 'COMPTABLE',
  'ENSEIGNANT', 'PARENT', 'ELEVE', 'VISITEUR',
] as const;

const createSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  email: z.string().trim().email('L\u2019email est invalide.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
  role: z.enum(MANAGEABLE_ROLES),
  provinceAdministrative: z.string().trim().optional().or(z.literal('')),
  institutionName: z.string().trim().optional().or(z.literal('')),
  typeInstitution: z.string().trim().optional().or(z.literal('')),
  fonction: z.string().trim().optional().or(z.literal('')),
  grade: z.string().trim().optional().or(z.literal('')),
  ecoleId: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin-smd/users — liste paginée des utilisateurs.
 * Recherche, filtres (statut, rôle, périmètre) et statistiques agrégées.
 */
export async function GET(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!can(currentUser.role, PERM.ADMIN_USERS)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const statusFilter = searchParams.get('status') || '';
  const roleFilter = searchParams.get('role') || '';
  const scopeFilter = searchParams.get('scope') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  // ── Construction du where ──
  const where: Record<string, unknown> = {};

  if (roleFilter) where.role = roleFilter;

  if (statusFilter) where.userStatus = statusFilter;

  // Filtre périmètre
  if (scopeFilter === 'national') {
    where.ecoleId = null;
    where.coordSousProvincialeId = null;
    where.provinceAdministrative = '';
  } else if (scopeFilter === 'province') {
    where.NOT = [{ provinceAdministrative: '' }];
    where.coordSousProvincialeId = null;
    where.ecoleId = null;
  } else if (scopeFilter === 'sous-province') {
    where.NOT = [{ coordSousProvincialeId: null }];
    where.ecoleId = null;
  } else if (scopeFilter === 'etablissement') {
    where.NOT = [{ ecoleId: null }];
  }

  // Recherche multi-champs
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { postNom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
      { institutionName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // ── Requêtes parallèles : liste + total + stats ──
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [users, total, stats] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, nom: true, postNom: true, prenom: true, email: true,
        telephone: true, role: true, isActive: true, userStatus: true,
        createdAt: true, updatedAt: true, profilePhotoUrl: true,
        provinceAdministrative: true, institutionName: true, typeInstitution: true,
        fonction: true, grade: true, ecoleId: true, coordSousProvincialeId: true,
        ecole: { select: { nom: true } },
        coordSousProvinciale: { select: { nom: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({
      by: ['userStatus'],
      _count: true,
    }),
  ]);

  // ── Statistiques ──
  const totalUsers = await prisma.user.count();
  const newUsers = await prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } });
  const statusMap: Record<string, number> = {};
  for (const s of stats) statusMap[s.userStatus] = s._count;

  return NextResponse.json({
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      total: totalUsers,
      actifs: statusMap['ACTIF'] ?? 0,
      enAttente: statusMap['EN_ATTENTE'] ?? 0,
      suspendus: statusMap['SUSPENDU'] ?? 0,
      desactives: statusMap['DESACTIVE'] ?? 0,
      nouveaux: newUsers,
    },
  });
}

/**
 * POST /api/admin-smd/users — créer un utilisateur.
 * L'Admin SMD ne peut pas créer de SUPER_ADMIN ni d'ADMIN_SCHOOL_MANAGER_RDC.
 */
export async function POST(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!can(currentUser.role, PERM.ADMIN_USERS)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ── Protection des rôles restreints ──
  if (RESTRICTED_ROLES.includes(data.role as any)) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas créer un compte avec ce rôle.' },
      { status: 403 }
    );
  }

  // Email unique
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const isActive = data.isActive ?? false;
  const userStatus = isActive ? 'ACTIF' : 'EN_ATTENTE';

  const user = await prisma.user.create({
    data: {
      nom: data.nom,
      postNom: data.postNom ?? '',
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone ?? '',
      passwordHash,
      role: data.role,
      provinceAdministrative: data.provinceAdministrative ?? '',
      institutionName: data.institutionName ?? '',
      typeInstitution: data.typeInstitution ?? '',
      fonction: data.fonction ?? '',
      grade: data.grade ?? '',
      ecoleId: data.ecoleId || null,
      coordSousProvincialeId: data.coordSousProvincialeId || null,
      isActive,
      userStatus,
    },
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, role: true, isActive: true, userStatus: true, createdAt: true,
    },
  });

  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: `${currentUser.prenom} ${currentUser.nom}`.trim(),
    action: 'CREATE_USER',
    module: 'users',
    resourceId: user.id,
    details: `Création du compte ${user.email} (${user.role})`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ user }, { status: 201 });
}
