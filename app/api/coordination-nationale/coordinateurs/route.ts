import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireNationalAccess, displayName } from '@/lib/national-access';
import { hashPassword } from '@/lib/auth';
import { logAudit, getClientIP } from '@/lib/audit';
import { PROVINCE_NAMES } from '@/lib/provinces-rdc';

export const dynamic = 'force-dynamic';

/** Rôle géré par la Coordination nationale : uniquement les coordinateurs provinciaux. */
const MANAGED_ROLE = 'COORDINATION_PROVINCIALE';

const createSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  email: z.string().trim().email('L\u2019email est invalide.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
  provinceAdministrative: z.enum(PROVINCE_NAMES as [string, ...string[]], {
    errorMap: () => ({ message: 'La province est obligatoire.' }),
  }),
  fonction: z.string().trim().optional().or(z.literal('')),
  grade: z.string().trim().optional().or(z.literal('')),
});

/**
 * GET /api/coordination-nationale/coordinateurs
 * Liste des comptes de coordination provinciale (périmètre national).
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const province = searchParams.get('province')?.trim() || '';

  const where: Record<string, unknown> = { role: MANAGED_ROLE };
  if (province) where.provinceAdministrative = province;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { postNom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const coordinateurs = await prisma.user.findMany({
    where,
    orderBy: [{ provinceAdministrative: 'asc' }, { nom: 'asc' }],
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, provinceAdministrative: true, fonction: true, grade: true,
      isActive: true, userStatus: true, createdAt: true,
    },
  });

  return NextResponse.json({ coordinateurs, provinces: PROVINCE_NAMES });
}

/**
 * POST /api/coordination-nationale/coordinateurs
 * Création d'un compte de coordination provinciale par le niveau national.
 * Le rôle est imposé côté serveur : aucune élévation de privilège possible.
 */
export async function POST(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;
  const currentUser = auth.user;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Un compte existe déjà avec cet email.' },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(data.password);

  const coordinateur = await prisma.user.create({
    data: {
      nom: data.nom,
      postNom: data.postNom ?? '',
      prenom: data.prenom,
      email,
      telephone: data.telephone ?? '',
      passwordHash,
      role: MANAGED_ROLE,
      typeInstitution: 'EC_ERC',
      institutionName: `Coordination provinciale EC-ERC — ${data.provinceAdministrative}`,
      provinceAdministrative: data.provinceAdministrative,
      fonction: data.fonction || 'Coordonnateur provincial',
      grade: data.grade ?? '',
      isActive: true,
      userStatus: 'ACTIF',
    },
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, provinceAdministrative: true, fonction: true, grade: true,
      isActive: true, userStatus: true, createdAt: true,
    },
  });

  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: displayName(currentUser),
    action: 'CREATE_COORDINATEUR_PROVINCIAL',
    module: 'coordination-nationale',
    resource: 'user',
    resourceId: coordinateur.id,
    details: `Création du compte ${email} (${data.provinceAdministrative})`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ coordinateur }, { status: 201 });
}
