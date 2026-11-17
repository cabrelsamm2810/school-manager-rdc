import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildEcolesWhere, type EcoleFilterUser } from '@/lib/ecoles-query';
import { INSTITUTION_MAP } from '@/lib/institutions';

export const dynamic = 'force-dynamic';

/** Enlève les accents et caractères non sûrs d'un nom de fichier. */
function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

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

  const rows = ecoles.map((e) => ({
    Province: e.province || '',
    'Province éducationnelle': e.provinceEducationnelle || '',
    Commune: e.commune || '',
    Ville: e.ville || '',
    'Nom de l\u2019école': e.nom,
    'Identifiant SM': e.identifiantSM || '',
    DINACOPE: e.dinacope || '',
    Niveau: e.type || '',
    Institution: INSTITUTION_MAP[e.institution]?.label?.split('—')[0]?.trim() || e.institution,
    'Chef d\u2019établissement': e.chefEcole || '',
    Téléphone: e.telephone || '',
    Email: e.email || '',
    Adresse: e.adresse || '',
    Effectif: e.effectif,
    Statut: e.statut,
    'Statut de validation': e.statutValidation,
    'Structure de rattachement': e.coordSousProvinciale?.nom || e.ecErc?.nom || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 36 },
    { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 28 },
    { wch: 16 }, { wch: 26 }, { wch: 36 }, { wch: 10 }, { wch: 12 },
    { wch: 26 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Écoles');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const province = searchParams.get('province');
  const date = new Date().toISOString().slice(0, 10);
  const filename = `ecoles_${province ? `${slug(province)}_` : ''}${date}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
