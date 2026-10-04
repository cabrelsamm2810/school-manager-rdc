import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

interface ParsedRow {
  matricule?: string;
  nom?: string;
  postNom?: string;
  prenom?: string;
  sexe?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  classe?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  nomTuteur?: string;
  telephoneTuteur?: string;
  etablissementId?: string;
}

/** POST /api/import/eleves — import en masse depuis un fichier Excel/CSV */
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

  if (rows.length > 5000) {
    return NextResponse.json({ error: 'Trop de lignes (maximum 5000 par import).' }, { status: 400 });
  }

  let imported = 0;
  const errors: { row: number; message: string }[] = [];
  const existingMatricules = new Set<string>();

  // Pre-fetch existing matricules to avoid duplicates
  const existing = await prisma.eleve.findMany({ select: { matricule: true } });
  existing.forEach((e) => existingMatricules.add(e.matricule));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const matricule = String(row.matricule ?? '').trim();
    const nom = String(row.nom ?? '').trim();
    const prenom = String(row.prenom ?? '').trim();
    const classe = String(row.classe ?? '').trim();

    if (!matricule || !nom || !prenom || !classe) {
      errors.push({ row: i + 2, message: 'Matricule, nom, pr\u00e9nom et classe sont obligatoires.' });
      continue;
    }

    if (existingMatricules.has(matricule)) {
      errors.push({ row: i + 2, message: `Matricule "${matricule}" d\u00e9j\u00e0 existant.` });
      continue;
    }

    try {
      const sexe = String(row.sexe ?? '').trim().toUpperCase();
      const dateStr = String(row.dateNaissance ?? '').trim();
      let dateNaissance: Date | null = null;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) dateNaissance = parsed;
      }

      await prisma.eleve.create({
        data: {
          matricule,
          nom,
          postNom: String(row.postNom ?? '').trim(),
          prenom,
          sexe: sexe === 'M' || sexe === 'F' ? sexe : '',
          dateNaissance,
          lieuNaissance: String(row.lieuNaissance ?? '').trim(),
          classe,
          telephone: String(row.telephone ?? '').trim(),
          email: String(row.email ?? '').trim(),
          adresse: String(row.adresse ?? '').trim(),
          nomTuteur: String(row.nomTuteur ?? '').trim(),
          telephoneTuteur: String(row.telephoneTuteur ?? '').trim(),
          etablissementId: String(row.etablissementId ?? '').trim() || null,
        },
      });
      existingMatricules.add(matricule);
      imported++;
    } catch {
      errors.push({ row: i + 2, message: 'Erreur lors de l\'enregistrement.' });
    }
  }

  return NextResponse.json({ imported, errors, total: rows.length });
}
