import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { normalizeInstitution, type ParsedSchoolRow, type PreviewRow } from '@/lib/txt-import-parser';

/**
 * POST /api/import/ecoles/preview
 *
 * Reçoit un tableau de lignes parsées depuis un fichier TXT,
 * vérifie les doublons potentiels en base et renvoie chaque ligne
 * avec son statut (ok / warning / error).
 *
 * Aucune donnée n'est enregistrée : cette route est purement consultative.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: 'Format de requête invalide.' }, { status: 400 });
  }

  const rows = body.rows as ParsedSchoolRow[];
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne à vérifier.' }, { status: 400 });
  }

  if (rows.length > 500) {
    return NextResponse.json({ error: 'Trop de lignes (maximum 500 par import).' }, { status: 400 });
  }

  // Récupérer tous les noms d'écoles existants pour la détection de doublons
  const noms = rows
    .map((r) => r.nom?.trim())
    .filter((n): n is string => !!n && n.length > 0)
    .map((n) => n.toLowerCase());

  const existing = noms.length > 0
    ? await prisma.ecole.findMany({
        where: {
          OR: noms.map((n) => ({
            nom: { contains: n, mode: 'insensitive' as const },
          })),
        },
        select: { id: true, nom: true },
      })
    : [];

  // Index des écoles existantes par nom normalisé
  const existingByExactName = new Map<string, { id: string; nom: string }>();
  const existingNames = existing.map((e) => {
    const key = e.nom.toLowerCase().trim();
    existingByExactName.set(key, e);
    return { id: e.id, nom: e.nom, key };
  });

  const previewRows: PreviewRow[] = rows.map((row, i) => {
    const messages: string[] = [];
    let status: 'ok' | 'warning' | 'error' = 'ok';

    const nom = row.nom?.trim() ?? '';
    if (!nom) {
      status = 'error';
      messages.push("Le nom de l'école est obligatoire.");
    } else {
      const key = nom.toLowerCase();
      const exact = existingByExactName.get(key);
      if (exact) {
        status = 'warning';
        messages.push(`Doublon : « ${exact.nom} » existe déjà (ID: ${exact.id}).`);
      } else {
        // Recherche de similarité (contient ou est contenu)
        const similar = existingNames.find((e) => {
          if (e.key === key) return false;
          return e.key.includes(key) || key.includes(e.key);
        });
        if (similar) {
          status = 'warning';
          messages.push(`Doublon potentiel : « ${similar.nom} » ressemble à cette école.`);
        }
      }
    }

    // Validation de l'institution si fournie
    if (row.institution?.trim()) {
      const normalized = normalizeInstitution(row.institution);
      const validCodes = ['EC_ERC', 'PUBLIQUE', 'CATHOLIQUE', 'ISLAMIQUE', 'INDEPENDANTE'];
      if (!validCodes.includes(normalized)) {
        if (status === 'ok') status = 'warning';
        messages.push(`Convention « ${row.institution} » non reconnue. Sera ignorée.`);
      }
    }

    // Validation de l'email si fourni
    if (row.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
      if (status === 'ok') status = 'warning';
      messages.push('Adresse e-mail invalide.');
    }

    return {
      ...row,
      rowIndex: i,
      status,
      messages,
      duplicateId: existingByExactName.get(nom.toLowerCase())?.id,
      duplicateNom: existingByExactName.get(nom.toLowerCase())?.nom,
    };
  });

  return NextResponse.json({ rows: previewRows });
}
