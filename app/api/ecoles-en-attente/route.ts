import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { hasAtLeastRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';

export const dynamic = 'force-dynamic';

/** Rôles autorisés à consulter les écoles en attente. */
const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_SCHOOL_MANAGER_RDC',
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
];

/**
 * GET /api/ecoles-en-attente — liste des écoles en attente de validation.
 *
 * Renvoie les écoles dont le statut de validation est « En attente de vérification »
 * ou « En cours de vérification », filtrées par le périmètre territorial de l'utilisateur :
 *  - national : SUPER_ADMIN, ADMIN_SCHOOL_MANAGER_RDC, COORDINATION_NATIONALE → toutes
 *  - provincial : COORDINATION_PROVINCIALE, AGENT_PROVINCIAL → leur province
 *  - sous-provincial : COORDINATION_SOUS_PROVINCIALE → leur sous-division
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Rôle insuffisant.' }, { status: 403 });
  }

  const scope = getScopeLevel(user.role);

  const where: Record<string, unknown> = {
    statutValidation: { in: ['En attente de vérification', 'En cours de vérification'] },
  };

  // ── Filtrage par périmètre territorial ──
  if (scope === 'provincial') {
    if (user.provinceAdministrative) {
      where.province = user.provinceAdministrative;
    }
  } else if (scope === 'sousProvincial') {
    if (user.coordSousProvincialeId) {
      where.coordSousProvincialeId = user.coordSousProvincialeId;
    } else if (user.provinceAdministrative) {
      where.province = user.provinceAdministrative;
    }
  }

  // Isolation par institution (sauf SUPER_ADMIN et ADMIN_SCHOOL_MANAGER_RDC)
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN_SCHOOL_MANAGER_RDC' && user.typeInstitution) {
    where.institution = user.typeInstitution;
  }

  const ecoles = await prisma.ecole.findMany({
    where,
    select: {
      id: true,
      nom: true,
      type: true,
      institution: true,
      dinacope: true,
      province: true,
      provinceEducationnelle: true,
      ville: true,
      commune: true,
      telephone: true,
      email: true,
      chefEcole: true,
      logoUrl: true,
      identifiantSM: true,
      statut: true,
      statutValidation: true,
      createdAt: true,
      coordSousProvincialeId: true,
      coordSousProvinciale: { select: { id: true, nom: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return NextResponse.json({ ecoles });
}
