import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { hasAtLeastRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';
import { resolveFileUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** Rôles autorisés à consulter les documents transmis par une école. */
const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_SCHOOL_MANAGER_RDC',
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
];

/**
 * GET /api/ecoles/[id]/documents-transmis
 *
 * Renvoie les documents justificatifs d'une école, accessibles aux rôles de
 * coordination (provinciale et sous-provinciale) pour vérification.
 * Le périmètre territorial est vérifié côté serveur.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Rôle insuffisant.' }, { status: 403 });
  }

  const ecole = await prisma.ecole.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      nom: true,
      institution: true,
      province: true,
      coordSousProvincialeId: true,
      statutValidation: true,
    },
  });

  if (!ecole) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  // ── Vérification du périmètre territorial ──
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN_SCHOOL_MANAGER_RDC') {
    // Isolation par institution
    if (user.typeInstitution && ecole.institution !== user.typeInstitution) {
      return NextResponse.json(
        { error: "Cette école n'appartient pas à votre institution." },
        { status: 403 },
      );
    }

    const scope = getScopeLevel(user.role);

    if (scope === 'provincial') {
      if (user.provinceAdministrative && ecole.province !== user.provinceAdministrative) {
        return NextResponse.json(
          { error: "Cette école n'appartient pas à votre province." },
          { status: 403 },
        );
      }
    } else if (scope === 'sousProvincial') {
      if (user.coordSousProvincialeId && ecole.coordSousProvincialeId !== user.coordSousProvincialeId) {
        return NextResponse.json(
          { error: "Cette école n'appartient pas à votre coordination sous-provinciale." },
          { status: 403 },
        );
      }
    }
  }

  // ── Récupération des documents ──
  const documents = await prisma.ecoleDocument.findMany({
    where: { ecoleId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  // Résolution des URLs R2 en URLs signées (1 h)
  const resolved = await Promise.all(
    documents.map(async (d) => ({
      ...d,
      fileUrl: await resolveFileUrl(d.fileUrl, { signed: true }),
    })),
  );

  return NextResponse.json({ documents: resolved, ecole });
}
