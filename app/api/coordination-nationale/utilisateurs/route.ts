import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Role } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireNationalPermission } from '@/lib/national-access';
import { PERM } from '@/lib/permissions';
import { getNationalFonction } from '@/lib/national-fonctions';
import { NATIONAL_MANAGED_ROLES, isNationalManagedRole } from '@/lib/national-users';
import { logAudit, getClientIP } from '@/lib/audit';

const createSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  email: z.string().trim().email("L'email est invalide."),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
  role: z.enum(NATIONAL_MANAGED_ROLES),
  fonction: z.string().trim().optional().or(z.literal('')),
  provinceAdministrative: z.string().trim().optional().or(z.literal('')),
  provinceEducationnelle: z.string().trim().optional().or(z.literal('')),
  bureauAffectation: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/coordination-nationale/utilisateurs
 * Comptes de la sphère EC-ERC (national, provincial, sous-provincial, agents).
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalPermission(request, PERM.NATIONAL_USERS);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || '';
  const search = searchParams.get('search') || '';

  const roleFilter = isNationalManagedRole(role)
    ? { role: role as Role }
    : { role: { in: [...NATIONAL_MANAGED_ROLES] as Role[] } };

  const users = await prisma.user.findMany({
    where: {
      ...roleFilter,
      ...(search
        ? {
            OR: [
              { nom: { contains: search, mode: 'insensitive' as const } },
              { prenom: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nom: true,
      postNom: true,
      prenom: true,
      email: true,
      telephone: true,
      role: true,
      fonction: true,
      provinceAdministrative: true,
      provinceEducationnelle: true,
      bureauAffectation: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ role: 'asc' }, { nom: 'asc' }],
  });

  return NextResponse.json({ users });
}

/** POST /api/coordination-nationale/utilisateurs — créer un compte. */
export async function POST(request: NextRequest) {
  const auth = await requireNationalPermission(request, PERM.NATIONAL_USERS);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const data = parsed.data;
  const fonction = data.fonction ?? '';

  if (data.role === 'COORDINATION_NATIONALE' && !getNationalFonction(fonction)) {
    return NextResponse.json(
      { error: 'Choisissez la fonction nationale du compte (coordinateur, chef d\u2019administration, secrétaire ou agent).' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      nom: data.nom,
      postNom: data.postNom ?? '',
      prenom: data.prenom,
      sexe: '',
      email: data.email,
      telephone: data.telephone ?? '',
      passwordHash,
      role: data.role,
      typeInstitution: 'EC_ERC',
      institutionName:
        data.role === 'COORDINATION_NATIONALE' ? 'Coordination nationale EC-ERC' : 'EC-ERC',
      provinceAdministrative: data.provinceAdministrative ?? '',
      provinceEducationnelle: data.provinceEducationnelle ?? '',
      bureauAffectation: data.bureauAffectation ?? '',
      fonction: data.role === 'COORDINATION_NATIONALE' ? fonction : '',
      coordSousProvincialeId: data.coordSousProvincialeId || null,
      isActive: data.isActive ?? true,
      userStatus: data.isActive === false ? 'EN_ATTENTE' : 'ACTIF',
    },
    select: { id: true, nom: true, prenom: true, email: true, role: true, fonction: true, isActive: true },
  });

  await logAudit({
    userId: auth.user.id,
    userRole: auth.user.role,
    userName: `${auth.user.prenom} ${auth.user.nom}`.trim(),
    action: 'national.utilisateur.creer',
    module: 'coordination-nationale',
    resource: 'user',
    resourceId: user.id,
    details: `${user.role} — ${user.email}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ user }, { status: 201 });
}
