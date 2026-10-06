import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

interface ParsedRow {
  nom?: string;
  type?: string;
  province?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  effectif?: string | number;
  statut?: string;
}

/** POST /api/import/ecoles — import en masse depuis un fichier Excel/CSV */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Aucun fichier re\u00e7u.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier trouv\u00e9 dans la requ\u00eate.' }, { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return NextResponse.json({ error: 'Le fichier est vide ou illisible.' }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: '' });

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne de donn\u00e9es trouv\u00e9e dans le fichier.' }, { status: 400 });
  }

  if (rows.length > 2000) {
    return NextResponse.json({ error: 'Trop de lignes (maximum 2000 par import).' }, { status: 400 });
  }

  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nom = String(row.nom ?? '').trim();

    if (!nom) {
      errors.push({ row: i + 2, message: 'Le nom de l\u2019\u00e9tablissement est obligatoire.' });
      continue;
    }

    const effectifNum = Number(row.effectif);
    try {
      await prisma.ecole.create({
        data: {
          nom,
          type: String(row.type ?? '').trim(),
          province: String(row.province ?? '').trim(),
          ville: String(row.ville ?? '').trim(),
          adresse: String(row.adresse ?? '').trim(),
          telephone: String(row.telephone ?? '').trim(),
          email: String(row.email ?? '').trim(),
          effectif: isNaN(effectifNum) ? 0 : Math.max(0, Math.floor(effectifNum)),
          statut: String(row.statut ?? 'Actif').trim() || 'Actif',
        },
      });
      imported++;
    } catch {
      errors.push({ row: i + 2, message: 'Erreur lors de l\'enregistrement.' });
    }
  }

  return NextResponse.json({ imported, errors, total: rows.length });
}
