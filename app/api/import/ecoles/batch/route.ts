import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';
import { generateIdentifiantSM, INSTITUTIONS } from '@/lib/institutions';
import { normalizeInstitution, type ParsedSchoolRow } from '@/lib/txt-import-parser';

/**
 * POST /api/import/ecoles/batch
 *
 * Enregistre en base un lot d'écoles préalablement validées par l'utilisateur.
 *
 * Étape 5 — Sauvegarde sécurisée :
 *  1. Recherche groupée des doublons en base (une seule requête au lieu de N).
 *  2. Détection des doublons intra-lot (le second exemplaire est ignoré).
 *  3. Vérification du périmètre territorial et institutionnel de l'utilisateur.
 *  4. Génération d'un identifiantSM unique pour chaque école créée.
 *  5. Enregistrement atomique via `prisma.$transaction` : tout réussit ou rien.
 *  6. Journal d'audit (EcoleValidationLog) pour chaque école créée.
 *
 * Aucune école existante n'est modifiée ni supprimée.
 */

type RowDetail = {
  row: number;
  nom: string;
  action: 'imported' | 'ignored' | 'rejected';
  message: string;
};

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
    return NextResponse.json({ error: 'Aucune ligne à enregistrer.' }, { status: 400 });
  }

  if (rows.length > 500) {
    return NextResponse.json({ error: 'Trop de lignes (maximum 500 par import).' }, { status: 400 });
  }

  const user = auth.user as any;
  const scope = getScopeLevel(user.role);

  // ── 1. Recherche groupée des doublons en base ──
  const noms = rows.map((r) => r.nom?.trim()).filter((n): n is string => !!n);
  const dinacopes = rows.map((r) => r.dinacope?.trim()).filter((d): d is string => !!d);
  const telephones = rows.map((r) => r.telephone?.trim()).filter((t): t is string => !!t);
  const emails = rows.map((r) => r.email?.trim()).filter((e): e is string => !!e);

  const orConditions: object[] = [];
  if (noms.length > 0) {
    orConditions.push(...noms.map((n) => ({ nom: { equals: n, mode: 'insensitive' as const } })));
  }
  if (dinacopes.length > 0) {
    orConditions.push(...dinacopes.map((d) => ({ dinacope: { equals: d, mode: 'insensitive' as const } })));
  }
  if (telephones.length > 0) {
    orConditions.push(...telephones.map((t) => ({ telephone: { equals: t, mode: 'insensitive' as const } })));
  }
  if (emails.length > 0) {
    orConditions.push(...emails.map((e) => ({ email: { equals: e, mode: 'insensitive' as const } })));
  }

  const existing = orConditions.length > 0
    ? await prisma.ecole.findMany({
        where: { OR: orConditions },
        select: { id: true, nom: true, dinacope: true, telephone: true, email: true, identifiantSM: true },
      })
    : [];

  const existingByNom = new Map<string, { id: string; nom: string }>();
  const existingByDinacope = new Map<string, string>();
  const existingByTel = new Map<string, string>();
  const existingByEmail = new Map<string, string>();
  const existingIdentifiants = new Set<string>();

  for (const e of existing) {
    const nomKey = e.nom.toLowerCase().trim();
    if (nomKey) existingByNom.set(nomKey, { id: e.id, nom: e.nom });
    if (e.dinacope?.trim()) existingByDinacope.set(e.dinacope.trim().toLowerCase(), e.id);
    if (e.telephone?.trim()) existingByTel.set(e.telephone.trim(), e.id);
    if (e.email?.trim()) existingByEmail.set(e.email.trim().toLowerCase(), e.id);
    if (e.identifiantSM) existingIdentifiants.add(e.identifiantSM);
  }

  // ── 2. Détection des doublons intra-lot ──
  const seenNomInBatch = new Set<string>();
  const seenDinacopeInBatch = new Set<string>();
  const seenTelInBatch = new Set<string>();
  const seenEmailInBatch = new Set<string>();

  // ── 3. Préparer les lignes à enregistrer (filtrage pré-transaction) ──
  const details: RowDetail[] = [];
  const toCreate: { row: ParsedSchoolRow; index: number }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nom = row.nom?.trim() ?? '';

    if (!nom) {
      details.push({ row: i + 1, nom: '(vide)', action: 'rejected', message: "Nom de l'école obligatoire." });
      continue;
    }

    const nomLower = nom.toLowerCase();

    // Doublon en base (par nom)
    const existingEcole = existingByNom.get(nomLower);
    if (existingEcole) {
      details.push({ row: i + 1, nom, action: 'ignored', message: `Doublon : « ${existingEcole.nom} » existe déjà.` });
      continue;
    }

    // Doublon en base (par DINACOPE)
    const din = row.dinacope?.trim();
    if (din && existingByDinacope.has(din.toLowerCase())) {
      details.push({ row: i + 1, nom, action: 'ignored', message: `DINACOPE « ${din} » déjà utilisé en base.` });
      continue;
    }

    // Doublon en base (par téléphone)
    const tel = row.telephone?.trim();
    if (tel && existingByTel.has(tel)) {
      details.push({ row: i + 1, nom, action: 'ignored', message: `Téléphone « ${tel} » déjà utilisé en base.` });
      continue;
    }

    // Doublon en base (par e-mail)
    const em = row.email?.trim();
    if (em && existingByEmail.has(em.toLowerCase())) {
      details.push({ row: i + 1, nom, action: 'ignored', message: `E-mail « ${em} » déjà utilisé en base.` });
      continue;
    }

    // Doublon intra-lot (par nom)
    if (seenNomInBatch.has(nomLower)) {
      details.push({ row: i + 1, nom, action: 'ignored', message: 'Doublon dans ce lot (nom répété).' });
      continue;
    }
    seenNomInBatch.add(nomLower);

    // Doublon intra-lot (par DINACOPE)
    if (din) {
      const dinKey = din.toLowerCase();
      if (seenDinacopeInBatch.has(dinKey)) {
        details.push({ row: i + 1, nom, action: 'ignored', message: `Doublon dans ce lot (DINACOPE « ${din} » répété).` });
        continue;
      }
      seenDinacopeInBatch.add(dinKey);
    }

    // Doublon intra-lot (par téléphone)
    if (tel) {
      if (seenTelInBatch.has(tel)) {
        details.push({ row: i + 1, nom, action: 'ignored', message: `Doublon dans ce lot (téléphone « ${tel} » répété).` });
        continue;
      }
      seenTelInBatch.add(tel);
    }

    // Doublon intra-lot (par e-mail)
    if (em) {
      const emKey = em.toLowerCase();
      if (seenEmailInBatch.has(emKey)) {
        details.push({ row: i + 1, nom, action: 'ignored', message: `Doublon dans ce lot (e-mail « ${em} » répété).` });
        continue;
      }
      seenEmailInBatch.add(emKey);
    }

    // Normaliser l'institution
    const institution = row.institution?.trim()
      ? normalizeInstitution(row.institution)
      : user.typeInstitution || 'EC_ERC';

    const validInstitution = INSTITUTIONS.find((inst) => inst.code === institution);
    const finalInstitution = validInstitution ? institution : 'EC_ERC';

    // Vérifier le périmètre institutionnel
    if (user.role !== 'SUPER_ADMIN' && user.typeInstitution && user.typeInstitution !== finalInstitution) {
      details.push({ row: i + 1, nom, action: 'rejected', message: 'Institution non autorisée pour votre compte.' });
      continue;
    }

    // Vérifier le périmètre provincial
    if (scope === 'provincial' && user.provinceAdministrative && row.province?.trim() && row.province.trim() !== user.provinceAdministrative) {
      details.push({ row: i + 1, nom, action: 'rejected', message: 'Hors de votre province.' });
      continue;
    }

    toCreate.push({ row, index: i });
  }

  if (toCreate.length === 0) {
    const imported = 0;
    const ignored = details.filter((d) => d.action === 'ignored').length;
    const rejected = details.filter((d) => d.action === 'rejected').length;
    return NextResponse.json({ imported, ignored, rejected, total: rows.length, details });
  }

  // ── 4. Enregistrement atomique via transaction ──
  let imported = 0;
  try {
    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      const txDetails: RowDetail[] = [];

      for (const { row, index } of toCreate) {
        const nom = row.nom.trim();

        // Normaliser l'institution (refait dans la transaction pour cohérence)
        const institution = row.institution?.trim()
          ? normalizeInstitution(row.institution)
          : user.typeInstitution || 'EC_ERC';

        const validInstitution = INSTITUTIONS.find((inst) => inst.code === institution);
        const finalInstitution = validInstitution ? institution : 'EC_ERC';

        // Générer un identifiantSM unique (vérifié contre base + lot courant)
        let identifiantSM = generateIdentifiantSM(finalInstitution);
      let attempts = 0;
      while (existingIdentifiants.has(identifiantSM) && attempts < 20) {
        identifiantSM = generateIdentifiantSM(finalInstitution);
        attempts++;
      }
      existingIdentifiants.add(identifiantSM);

        const effectifNum = Number(row.effectif);
        const structureCompetente = INSTITUTIONS.find((inst) => inst.code === finalInstitution)?.structureCompetente ?? 'coordSousProvinciale';

        const ecole = await tx.ecole.create({
          data: {
            nom,
            type: row.type?.trim() || '',
            institution: finalInstitution,
            dinacope: row.dinacope?.trim() || '',
            province: row.province?.trim() || '',
            provinceEducationnelle: row.provinceEducationnelle?.trim() || '',
            ville: row.ville?.trim() || '',
            commune: row.commune?.trim() || '',
            adresse: row.adresse?.trim() || '',
            telephone: row.telephone?.trim() || '',
            email: row.email?.trim() || '',
            chefEcole: row.chefEcole?.trim() || '',
            identifiantSM,
            effectif: isNaN(effectifNum) ? 0 : Math.max(0, Math.floor(effectifNum)),
            statut: 'Actif',
            statutValidation: 'Brouillon',
            structureRattachementType: structureCompetente,
            coordSousProvincialeId: scope === 'sousProvincial' ? user.coordSousProvincialeId : null,
          },
        });

        // Journal d'audit : trace de la création
        await tx.ecoleValidationLog.create({
          data: {
            ecoleId: ecole.id,
            statut: 'Brouillon',
            commentaire: `École créée par import en lot (ligne ${index + 1}).`,
            validateurId: user.id,
            validateurNom: user.email || user.id,
          },
        });

        created++;
        txDetails.push({ row: index + 1, nom, action: 'imported', message: 'Enregistrée avec succès.' });
      }

      return { created, txDetails };
    });

    imported = result.created;
    details.push(...result.txDetails);
  } catch (err) {
    // La transaction a échoué : aucune école n'a été créée
    for (const { row, index } of toCreate) {
      details.push({
        row: index + 1,
        nom: row.nom?.trim() ?? '',
        action: 'rejected',
        message: 'Erreur lors de l\'enregistrement (transaction annulée).',
      });
    }
  }

  const ignored = details.filter((d) => d.action === 'ignored').length;
  const rejected = details.filter((d) => d.action === 'rejected').length;

  return NextResponse.json({ imported, ignored, rejected, total: rows.length, details });
}
