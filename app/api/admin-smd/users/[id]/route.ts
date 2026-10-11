import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';
import { RESTRICTED_ROLES } from '@/lib/roles';
import { hashPassword } from '@/lib/auth';
import { logAudit, getClientIP } from '@/lib/audit';
import { resolveFileUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  nom: z.string().trim().min(2).optional(),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  telephone: z.string().trim().optional().or(z.literal('')),
  role: z.enum([
    'COORDINATION_NATIONALE', 'COORDINATION_PROVINCIALE',
    'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL',
    'PROMOTEUR', 'DIRECTION_ECOLE', 'SECRETAIRE', 'COMPTABLE',
    'ENSEIGNANT', 'PARENT', 'ELEVE', 'VISITEUR',
  ]).optional(),
  provinceAdministrative: z.string().trim().optional().or(z.literal('')),
  institutionName: z.string().trim().optional().or(z.literal('')),
  fonction: z.string().trim().optional().or(z.literal('')),
  grade: z.string().trim().optional().or(z.literal('')),
  ecoleId: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8).optional(),
});

/**
 * GET /api/admin-smd/users/[id] — profil détaillé d'un utilisateur.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!can(currentUser.role, PERM.ADMIN_USER_PROFILES)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, role: true, isActive: true, userStatus: true,
      createdAt: true, updatedAt: true, profilePhotoUrl: true,
      provinceAdministrative: true, provinceEducationnelle: true,
      institutionName: true, typeInstitution: true,
      fonction: true, grade: true, dinacope: true,
      ecoleId: true, coordSousProvincialeId: true,
      ecole: { select: { id: true, nom: true, province: true, ville: true } },
      coordSousProvinciale: { select: { id: true, nom: true, province: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  // ── Historique d'audit pour cet utilisateur ──
  const auditHistory = await prisma.auditLog.findMany({
    where: {
      OR: [
        { resourceId: user.id },
        { details: { contains: user.email, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, userName: true, userRole: true, action: true,
      module: true, result: true, details: true, createdAt: true,
    },
  });

  return NextResponse.json({ user: { ...user, profilePhotoUrl: await resolveFileUrl(user.profilePhotoUrl) }, auditHistory });
}

/**
 * PATCH /api/admin-smd/users/[id] — modifier les informations d'un utilisateur.
 *
 * Protections :
 * - Ne peut pas modifier un compte SUPER_ADMIN.
 * - Ne peut pas modifier son propre rôle.
 * - Ne peut pas assigner un rôle restreint (SUPER_ADMIN, ADMIN_SCHOOL_MANAGER_RDC).
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!can(currentUser.role, PERM.ADMIN_USERS)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  // ── Ne pas modifier son propre compte ──
  if (currentUser.id === params.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas modifier votre propre compte depuis cette interface.' },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  // ── Ne pas modifier un SUPER_ADMIN ──
  if (target.role === 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Les comptes Super Administrateur ne peuvent pas être modifiés.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ── Protection des rôles restreints ──
  if (data.role && RESTRICTED_ROLES.includes(data.role as any)) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas assigner ce rôle.' },
      { status: 403 }
    );
  }

  // Email unique
  if (data.email && data.email !== target.email) {
    const conflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (conflict) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.nom !== undefined) updateData.nom = data.nom;
  if (data.postNom !== undefined) updateData.postNom = data.postNom;
  if (data.prenom !== undefined) updateData.prenom = data.prenom;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.telephone !== undefined) updateData.telephone = data.telephone;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.provinceAdministrative !== undefined) updateData.provinceAdministrative = data.provinceAdministrative;
  if (data.institutionName !== undefined) updateData.institutionName = data.institutionName;
  if (data.fonction !== undefined) updateData.fonction = data.fonction;
  if (data.grade !== undefined) updateData.grade = data.grade;
  if (data.ecoleId !== undefined) updateData.ecoleId = data.ecoleId || null;
  if (data.coordSousProvincialeId !== undefined) updateData.coordSousProvincialeId = data.coordSousProvincialeId || null;
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true, nom: true, postNom: true, prenom: true, email: true,
      telephone: true, role: true, isActive: true, userStatus: true, createdAt: true,
    },
  });

  // ── Journal d'audit ──
  const changedFields = Object.keys(updateData).join(', ');
  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: `${currentUser.prenom} ${currentUser.nom}`.trim(),
    action: 'UPDATE_USER',
    module: 'users',
    resourceId: params.id,
    details: `Modification des champs : ${changedFields}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ user });
}
