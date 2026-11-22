import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireNationalPermission } from '@/lib/national-access';
import { PERM } from '@/lib/permissions';
import { getNationalFonction } from '@/lib/national-fonctions';
import { isNationalManagedRole } from '@/lib/national-users';
import { logAudit, getClientIP } from '@/lib/audit';

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  fonction: z.string().trim().optional().or(z.literal('')),
  telephone: z.string().trim().optional().or(z.literal('')),
  provinceAdministrative: z.string().trim().optional().or(z.literal('')),
  provinceEducationnelle: z.string().trim().optional().or(z.literal('')),
  bureauAffectation: z.string().trim().optional().or(z.literal('')),
});

/**
 * PATCH /api/coordination-nationale/utilisateurs/[id]
 * Active/désactive un compte ou met à jour sa fonction et son affectation.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireNationalPermission(request, PERM.NATIONAL_USERS);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || !isNationalManagedRole(target.role)) {
    return NextResponse.json({ error: 'Compte introuvable dans le périmètre EC-ERC.' }, { status: 404 });
  }

  const data = parsed.data;
  if (data.isActive === false && target.id === auth.user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' }, { status: 400 });
  }
  if (data.fonction && target.role === 'COORDINATION_NATIONALE' && !getNationalFonction(data.fonction)) {
    return NextResponse.json({ error: 'Fonction nationale invalide.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(data.isActive !== undefined
        ? { isActive: data.isActive, userStatus: data.isActive ? 'ACTIF' : 'SUSPENDU' }
        : {}),
      ...(data.fonction !== undefined && target.role === 'COORDINATION_NATIONALE' ? { fonction: data.fonction } : {}),
      ...(data.telephone !== undefined ? { telephone: data.telephone } : {}),
      ...(data.provinceAdministrative !== undefined
        ? { provinceAdministrative: data.provinceAdministrative }
        : {}),
      ...(data.provinceEducationnelle !== undefined
        ? { provinceEducationnelle: data.provinceEducationnelle }
        : {}),
      ...(data.bureauAffectation !== undefined ? { bureauAffectation: data.bureauAffectation } : {}),
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      fonction: true,
      provinceAdministrative: true,
      isActive: true,
    },
  });

  await logAudit({
    userId: auth.user.id,
    userRole: auth.user.role,
    userName: `${auth.user.prenom} ${auth.user.nom}`.trim(),
    action: 'national.utilisateur.modifier',
    module: 'coordination-nationale',
    resource: 'user',
    resourceId: user.id,
    details: `${user.email} — actif: ${user.isActive}${user.fonction ? ` — ${user.fonction}` : ''}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ user });
}
