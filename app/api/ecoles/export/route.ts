import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildEcolesWhere, type EcoleFilterUser } from '@/lib/ecoles-query';
import { buildEcolesWorkbook, ecolesExportFilename } from '@/lib/ecoles-export';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ecoles/export — télécharge la liste des écoles en Excel (.xlsx).
 *
 * Accepte les mêmes paramètres que GET /api/ecoles (search, province,
 * provinceEducationnelle, commune, type, institution, statutValidation) et
 * applique le même périmètre (institution + territoire). Les lignes sont
 * triées par province puis par nom, avec une colonne « Province ».
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const where = buildEcolesWhere(searchParams, auth.user as unknown as EcoleFilterUser);

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
