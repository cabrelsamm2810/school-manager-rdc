import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';

const createSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  sexe: z.enum(['M', 'F']).optional().or(z.literal('')),
  email: z.string().trim().email('L\u2019email est invalide.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
  role: z.enum([
    'SUPER_ADMIN', 'COORDINATION_NATIONALE', 'COORDINATION_PROVINCIALE',
    'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL',
    'DIRECTION_ECOLE', 'ENSEIGNANT', 'PARENT', 'ELEVE'
  ]),
  typeInstitution: z.string().trim().optional().or(z.literal('')),
  institutionName: z.string().trim().optional().or(z.literal('')),
  provinceAdministrative: z.string().trim().optional().or(z.literal('')),
  provinceEducationnelle: z.string().trim().optional().or(z.literal('')),
  bureauAffectation: z.string().trim().optional().or(z.literal('')),
  fonction: z.string().trim().optional().or(z.literal('')),
  grade: z.string().trim().optional().or(z.literal('')),
  dinacope: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

/** GET /api/users — liste des utilisateurs (filtrable). */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'COORDINATION_PROVINCIALE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const role = searchParams.get('role') || undefined;
  const isActive = searchParams.get('isActive');

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (isActive === 'true') where.isActive = true;
  if (isActive === 'false') where.isActive = false;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, role: true, isActive: true, createdAt: true,
      typeInstitution: true, institutionName: true, fonction: true, grade: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return NextResponse.json({ users });
}

/** POST /api/users — créer un utilisateur (admin). */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'SUPER_ADMIN');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
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
      sexe: data.sexe ?? '',
      email: data.email,
      telephone: data.telephone ?? '',
      passwordHash,
      role: data.role,
      typeInstitution: data.typeInstitution ?? '',
      institutionName: data.institutionName ?? '',
      provinceAdministrative: data.provinceAdministrative ?? '',
      provinceEducationnelle: data.provinceEducationnelle ?? '',
      bureauAffectation: data.bureauAffectation ?? '',
      fonction: data.fonction ?? '',
      grade: data.grade ?? '',
      dinacope: data.dinacope ?? '',
      isActive: data.isActive ?? true,
    },
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, role: true, isActive: true, createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
