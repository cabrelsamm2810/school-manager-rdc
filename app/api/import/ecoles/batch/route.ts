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
 * - Vérifie les doublons (skip si l'école existe déjà).
 * - Génère un identifiantSM unique pour chaque école créée.
 * - Respecte le périmètre territorial de l'utilisateur.
 * - Renvoie un bilan détaillé (importées / ignorées / rejetées).
 *
 * Aucune école existante n'est modifiée ni supprimée.
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
    return NextResponse.json({ error: 'Aucune ligne à enregistrer.' }, { status: 400 });
  }

  if (rows.length > 500) {
    return NextResponse.json({ error: 'Trop de lignes (maximum 500 par import).' }, { status: 400 });
  }

  const user = auth.user as any;
  const scope = getScopeLevel(user.role);

  let imported = 0;
  let ignored = 0;
  let rejected = 0;
  const details: { row: number; nom: string; action: 'imported' | 'ignored' | 'rejected'; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nom = row.nom?.trim() ?? '';

    if (!nom) {
      rejected++;
      details.push({ row: i + 1, nom: '(vide)', action: 'rejected', message: "Nom de l'école obligatoire." });
      continue;
    }

    try {
      // Vérifier les doublons
      const existing = await prisma.ecole.findFirst({
        where: { nom: { equals: nom, mode: 'insensitive' } },
        select: { id: true, nom: true },
      });

      if (existing) {
        ignored++;
        details.push({ row: i + 1, nom, action: 'ignored', message: `Doublon : « ${existing.nom} » existe déjà.` });
        continue;
      }

      // Normaliser l'institution
      const institution = row.institution?.trim()
        ? normalizeInstitution(row.institution)
        : user.typeInstitution || 'EC_ERC';

      // Vérifier que l'institution est reconnue
      const validInstitution = INSTITUTIONS.find((inst) => inst.code === institution);
      const finalInstitution = validInstitution ? institution : 'EC_ERC';

      // Vérifier le périmètre institutionnel
      if (user.role !== 'SUPER_ADMIN' && user.typeInstitution && user.typeInstitution !== finalInstitution) {
        rejected++;
        details.push({ row: i + 1, nom, action: 'rejected', message: 'Institution non autorisée pour votre compte.' });
        continue;
      }

      // Vérifier le périmètre provincial
      if (scope === 'provincial' && user.provinceAdministrative && row.province?.trim() && row.province.trim() !== user.provinceAdministrative) {
        rejected++;
        details.push({ row: i + 1, nom, action: 'rejected', message: 'Hors de votre province.' });
        continue;
      }

      // Générer un identifiantSM unique
      let identifiantSM = generateIdentifiantSM(finalInstitution);
      let attempts = 0;
      while (attempts < 10) {
        const exists = await prisma.ecole.findFirst({ where: { identifiantSM } });
        if (!exists) break;
        identifiantSM = generateIdentifiantSM(finalInstitution);
        attempts++;
      }

      const effectifNum = Number(row.effectif);
      const structureCompetente = INSTITUTIONS.find((inst) => inst.code === finalInstitution)?.structureCompetente ?? 'coordSousProvinciale';

      await prisma.ecole.create({
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

      imported++;
      details.push({ row: i + 1, nom, action: 'imported', message: 'Enregistrée avec succès.' });
    } catch {
      rejected++;
      details.push({ row: i + 1, nom, action: 'rejected', message: 'Erreur lors de l\'enregistrement.' });
    }
  }

  return NextResponse.json({ imported, ignored, rejected, total: rows.length, details });
}
