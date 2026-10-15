import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { normalizeInstitution, type ParsedSchoolRow, type PreviewRow } from '@/lib/txt-import-parser';

/**
 * POST /api/import/ecoles/preview
 *
 * Reçoit un tableau de lignes parsées depuis un fichier TXT ou une photo OCR,
 * vérifie les doublons potentiels en base et dans le lot lui-même, puis renvoie
 * chaque ligne avec son statut (ok / warning / error).
 *
 * Aucune donnée n'est enregistrée : cette route est purement consultative.
 *
 * Détection des doublons (étape 4) :
 *  1. Doublons exacts en base — nom identique (insensible à la casse).
 *  2. Doublons similaires en base — nom normalisé proche (Levenshtein ≤ 2).
 *  3. Doublons par identifiant — DINACOPE, téléphone ou e-mail déjà en base.
 *  4. Doublons intra-lot — même nom ou même identifiant répété dans l'import.
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

  // ── 1. Collecter les valeurs à rechercher en base ──
  const noms = rows
    .map((r) => r.nom?.trim())
    .filter((n): n is string => !!n && n.length > 0);

  const dinacopes = rows
    .map((r) => r.dinacope?.trim())
    .filter((d): d is string => !!d && d.length > 0);

  const telephones = rows
    .map((r) => r.telephone?.trim())
    .filter((t): t is string => !!t && t.length > 0);

  const emails = rows
    .map((r) => r.email?.trim())
    .filter((e): e is string => !!e && e.length > 0);

  // ── 2. Recherche groupée en base (une seule requête au lieu de N) ──
  const orConditions: object[] = [];
  if (noms.length > 0) {
    orConditions.push(
      ...noms.map((n) => ({ nom: { equals: n, mode: 'insensitive' as const } })),
    );
  }
  if (dinacopes.length > 0) {
    orConditions.push(
      ...dinacopes.map((d) => ({ dinacope: { equals: d, mode: 'insensitive' as const } })),
    );
  }
  if (telephones.length > 0) {
    orConditions.push(
      ...telephones.map((t) => ({ telephone: { equals: t, mode: 'insensitive' as const } })),
    );
  }
  if (emails.length > 0) {
    orConditions.push(
      ...emails.map((e) => ({ email: { equals: e, mode: 'insensitive' as const } })),
    );
  }

  const existing = orConditions.length > 0
    ? await prisma.ecole.findMany({
        where: { OR: orConditions },
        select: { id: true, nom: true, dinacope: true, telephone: true, email: true },
      })
    : [];

  // Index des écoles existantes par clé normalisée
  const existingByNom = new Map<string, { id: string; nom: string }>();
  const existingByDinacope = new Map<string, { id: string; nom: string }>();
  const existingByTel = new Map<string, { id: string; nom: string }>();
  const existingByEmail = new Map<string, { id: string; nom: string }>();
  const existingNomsNormalized: { key: string; nom: string; id: string }[] = [];

  for (const e of existing) {
    const nomKey = e.nom.toLowerCase().trim();
    if (nomKey) {
      existingByNom.set(nomKey, { id: e.id, nom: e.nom });
      existingNomsNormalized.push({ key: nomKey, nom: e.nom, id: e.id });
    }
    if (e.dinacope?.trim()) existingByDinacope.set(e.dinacope.trim().toLowerCase(), { id: e.id, nom: e.nom });
    if (e.telephone?.trim()) existingByTel.set(e.telephone.trim(), { id: e.id, nom: e.nom });
    if (e.email?.trim()) existingByEmail.set(e.email.trim().toLowerCase(), { id: e.id, nom: e.nom });
  }

  // ── 3. Détection des doublons intra-lot ──
  const seenNomInBatch = new Map<string, number[]>(); // nom normalisé → indices
  const seenDinacopeInBatch = new Map<string, number[]>();
  const seenTelInBatch = new Map<string, number[]>();
  const seenEmailInBatch = new Map<string, number[]>();

  rows.forEach((row, i) => {
    const nom = row.nom?.trim().toLowerCase();
    if (nom) {
      if (!seenNomInBatch.has(nom)) seenNomInBatch.set(nom, []);
      seenNomInBatch.get(nom)!.push(i);
    }
    const din = row.dinacope?.trim().toLowerCase();
    if (din) {
      if (!seenDinacopeInBatch.has(din)) seenDinacopeInBatch.set(din, []);
      seenDinacopeInBatch.get(din)!.push(i);
    }
    const tel = row.telephone?.trim();
    if (tel) {
      if (!seenTelInBatch.has(tel)) seenTelInBatch.set(tel, []);
      seenTelInBatch.get(tel)!.push(i);
    }
    const em = row.email?.trim().toLowerCase();
    if (em) {
      if (!seenEmailInBatch.has(em)) seenEmailInBatch.set(em, []);
      seenEmailInBatch.get(em)!.push(i);
    }
  });

  // ── 4. Distance de Levenshtein pour similarité ──
  function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
    return matrix[a.length][b.length];
  }

  // ── 5. Construire les lignes prévisualisées ──
  const previewRows: PreviewRow[] = rows.map((row, i) => {
    const messages: string[] = [];
    let status: 'ok' | 'warning' | 'error' = 'ok';

    const nom = row.nom?.trim() ?? '';
    const nomLower = nom.toLowerCase();

    if (!nom) {
      status = 'error';
      messages.push("Le nom de l'école est obligatoire.");
    } else {
      // 5a. Doublon exact en base (par nom)
      const exact = existingByNom.get(nomLower);
      if (exact) {
        status = 'warning';
        messages.push(`Doublon : « ${exact.nom} » existe déjà (ID: ${exact.id}).`);
      } else {
        // 5b. Doublon similaire en base (Levenshtein ≤ 2 sur noms de longueur ≥ 5)
        if (nomLower.length >= 5) {
          const similar = existingNomsNormalized.find((e) => {
            if (e.key === nomLower) return false;
            const dist = levenshtein(nomLower, e.key);
            // Tolérance proportionnelle à la longueur : max 2 erreurs ou 10% du nom
            const tolerance = Math.max(2, Math.floor(Math.max(nomLower.length, e.key.length) / 10));
            return dist > 0 && dist <= tolerance;
          });
          if (similar) {
            status = 'warning';
            messages.push(`Doublon potentiel : « ${similar.nom} » ressemble à cette école.`);
          }
        }
      }

      // 5c. Doublon par DINACOPE en base
      const din = row.dinacope?.trim();
      if (din) {
        const dinMatch = existingByDinacope.get(din.toLowerCase());
        if (dinMatch) {
          status = 'warning';
          messages.push(`DINACOPE « ${din} » déjà utilisé par « ${dinMatch.nom} ».`);
        }
      }

      // 5d. Doublon par téléphone en base
      const tel = row.telephone?.trim();
      if (tel) {
        const telMatch = existingByTel.get(tel);
        if (telMatch) {
          status = 'warning';
          messages.push(`Téléphone « ${tel} » déjà utilisé par « ${telMatch.nom} ».`);
        }
      }

      // 5e. Doublon par e-mail en base
      const em = row.email?.trim();
      if (em) {
        const emMatch = existingByEmail.get(em.toLowerCase());
        if (emMatch) {
          status = 'warning';
          messages.push(`E-mail « ${em} » déjà utilisé par « ${emMatch.nom} ».`);
        }
      }

      // 5f. Doublons intra-lot (par nom)
      const batchNomIndices = seenNomInBatch.get(nomLower);
      if (batchNomIndices && batchNomIndices.length > 1) {
        status = 'warning';
        messages.push(`Doublon dans ce lot : « ${nom} » apparaît ${batchNomIndices.length} fois.`);
      }

      // 5g. Doublons intra-lot (par DINACOPE)
      if (din) {
        const batchDinIndices = seenDinacopeInBatch.get(din.toLowerCase());
        if (batchDinIndices && batchDinIndices.length > 1) {
          status = 'warning';
          messages.push(`DINACOPE « ${din} » répété ${batchDinIndices.length} fois dans ce lot.`);
        }
      }

      // 5h. Doublons intra-lot (par téléphone)
      if (tel) {
        const batchTelIndices = seenTelInBatch.get(tel);
        if (batchTelIndices && batchTelIndices.length > 1) {
          status = 'warning';
          messages.push(`Téléphone « ${tel} » répété ${batchTelIndices.length} fois dans ce lot.`);
        }
      }

      // 5i. Doublons intra-lot (par e-mail)
      if (em) {
        const batchEmIndices = seenEmailInBatch.get(em.toLowerCase());
        if (batchEmIndices && batchEmIndices.length > 1) {
          status = 'warning';
          messages.push(`E-mail « ${em} » répété ${batchEmIndices.length} fois dans ce lot.`);
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

    const exact = nomLower ? existingByNom.get(nomLower) : undefined;

    return {
      ...row,
      rowIndex: i,
      status,
      messages,
      duplicateId: exact?.id,
      duplicateNom: exact?.nom,
    };
  });

  return NextResponse.json({ rows: previewRows });
}
