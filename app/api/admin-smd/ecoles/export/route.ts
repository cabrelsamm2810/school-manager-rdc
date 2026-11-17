import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';
import { buildAdminEcolesWhere } from '@/lib/admin-smd-ecoles-query';
import { buildEcolesWorkbook, ecolesExportFilename } from '@/lib/ecoles-export';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin-smd/ecoles/export — télécharge les établissements en Excel (.xlsx).
 *
 * Permission requise : ADMIN_ECOLES (Admin School Manager RDC).
 * Accepte les mêmes paramètres que GET /api/admin-smd/ecoles (search, type,
 * statut, province, provinceEducationnelle, commune, niveau, institution) et
 * applique le même filtre : le fichier contient exactement les écoles affichées.
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
  const where = buildAdminEcolesWhere(searchParams);

  const ecoles = await prisma.ecole.findMany({
    where,
    orderBy: [{ province: 'asc' }, { nom: 'asc' }],
    include: {
      coordSousProvinciale: { select: { nom: true } },
      ecErc: { select: { nom: true } },
    },
  });

  const buf = buildEcolesWorkbook(ecoles);
  const filename = ecolesExportFilename(searchParams.get('province'));

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
