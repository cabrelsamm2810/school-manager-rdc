import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

interface ParsedRow {
  nom?: string;
  matricule?: string;
  grade?: string;
  etablissement?: string;
  specialite?: string;
  telephone?: string;
  email?: string;
  statut?: string;
}

/** POST /api/import/enseignants — import en masse depuis un fichier Excel/CSV */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier trouvé dans la requête.' }, { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return NextResponse.json({ error: 'Le fichier est vide ou illisible.' }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: '' });

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne de données trouvée dans le fichier.' }, { status: 400 });
  }

  if (rows.length > 2000) {
    return NextResponse.json({ error: 'Trop de lignes (maximum 2000 par import).' }, { status: 400 });
  }

  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nom = String(row.nom ?? '').trim();
    const matricule = String(row.matricule ?? '').trim();

    if (!nom) {
      errors.push({ row: i + 2, message: 'Le nom est obligatoire.' });
      continue;
    }
    if (!matricule) {
      errors.push({ row: i + 2, message: 'Le matricule est obligatoire.' });
      continue;
    }

    try {
      await prisma.enseignant.create({
        data: {
          nom,
          matricule,
          grade: String(row.grade ?? '').trim(),
          etablissement: String(row.etablissement ?? '').trim(),
          specialite: String(row.specialite ?? '').trim(),
          telephone: String(row.telephone ?? '').trim(),
          email: String(row.email ?? '').trim(),
          statut: String(row.statut ?? 'Actif').trim() || 'Actif',
        },
      });
      imported++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.';
      errors.push({ row: i + 2, message: msg.includes('unique') ? 'Matricule déjà existant.' : msg });
    }
  }

  return NextResponse.json({ imported, errors, total: rows.length });
}
