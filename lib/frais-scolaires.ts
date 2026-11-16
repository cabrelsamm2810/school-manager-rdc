import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { resolveFileUrl } from '@/lib/storage';
import { isSignedEleveQr, parseEleveQrValue } from '@/lib/eleve-qr';
import type { EleveSituation, FraisSituationRow } from '@/lib/finance-types';

/**
 * Domaine « frais scolaires » — School Manager RDC.
 *
 * Le QR code de la carte scolaire ne contient qu'un identifiant signé
 * (`lib/eleve-qr.ts`) : toute information financière est relue ici, en base,
 * après vérification de la signature. Rien de financier ne transite par le QR.
 */

/** Catégories créées par défaut dans chaque établissement (modifiables ensuite). */
export const DEFAULT_FRAIS_CATEGORIES = [
  'Frais scolaires',
  'Minerval',
  "Frais d'inscription",
  'Frais de réinscription',
  'Frais de bulletin',
  'Frais de carte scolaire',
  'Frais de transport',
  "Frais d'examen",
  'Frais de tenue',
  'Autres frais',
];

/** Modes de paiement créés par défaut (modifiables ensuite). */
export const DEFAULT_MODES_PAIEMENT = [
  'Espèces',
  'Airtel Money',
  'Orange Money',
  'Vodacom / M-Pesa',
  'Virement bancaire',
  'Autre',
];

/** Année scolaire en cours (rentrée en septembre), ex. « 2026-2027 ». */
export function anneeScolaireCourante(date = new Date()): string {
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

/**
 * Crée les catégories et modes de paiement par défaut de l'établissement
 * s'il n'en a encore aucun. Idempotent.
 */
export async function ensureFinanceDefaults(ecoleId: string | null | undefined): Promise<void> {
  if (!ecoleId) return;

  const [categories, modes] = await Promise.all([
    prisma.fraisCategorie.count({ where: { ecoleId } }),
    prisma.modePaiementFrais.count({ where: { ecoleId } }),
  ]);

  if (categories === 0) {
    await prisma.fraisCategorie.createMany({
      data: DEFAULT_FRAIS_CATEGORIES.map((nom, ordre) => ({
        ecoleId,
        nom,
        ordre,
        systeme: true,
      })),
      skipDuplicates: true,
    });
  }

  if (modes === 0) {
    await prisma.modePaiementFrais.createMany({
      data: DEFAULT_MODES_PAIEMENT.map((nom, ordre) => ({ ecoleId, nom, ordre })),
      skipDuplicates: true,
    });
  }
}

const ELEVE_INCLUDE = { ecole: { select: { id: true, nom: true } } } as const;

/**
 * Retrouve l'élève à partir d'une valeur scannée : QR signé (signature HMAC
 * vérifiée), matricule en clair, URL contenant `matricule`/`id`, ou id interne.
 */
export async function findEleveByScanValue(scannedValue: string) {
  const value = scannedValue.trim();
  if (!value) return { eleve: null, error: 'Valeur scannée vide.' } as const;

  if (isSignedEleveQr(value)) {
    const parsed = parseEleveQrValue(value);
    if (!parsed.ok) {
      return {
        eleve: null,
        error:
          parsed.reason === 'expired'
            ? 'QR Code expiré. Générez une nouvelle carte scolaire.'
            : 'QR Code élève invalide : signature non reconnue.',
      } as const;
    }
    const eleve = await prisma.eleve.findUnique({
      where: { id: parsed.eleveId },
      include: ELEVE_INCLUDE,
    });
    return { eleve, error: eleve ? null : 'Aucun élève trouvé pour ce QR Code.' } as const;
  }

  const byMatricule = await prisma.eleve.findUnique({
    where: { matricule: value },
    include: ELEVE_INCLUDE,
  });
  if (byMatricule) return { eleve: byMatricule, error: null } as const;

  try {
    const url = new URL(value);
    const matricule = url.searchParams.get('matricule') || url.searchParams.get('id');
    if (matricule) {
      const eleve = await prisma.eleve.findUnique({
        where: { matricule },
        include: ELEVE_INCLUDE,
      });
      if (eleve) return { eleve, error: null } as const;
    }
  } catch {
    // Pas une URL valide.
  }

  const byId = await prisma.eleve.findUnique({ where: { id: value }, include: ELEVE_INCLUDE });
  return { eleve: byId, error: byId ? null : 'Aucun élève trouvé pour cette valeur.' } as const;
}

export type { EleveSituation, FraisSituationRow } from '@/lib/finance-types';

function statutFor(montant: number, paye: number): FraisSituationRow['statut'] {
  if (paye <= 0) return 'EN_ATTENTE';
  return paye >= montant ? 'PAYE' : 'PARTIEL';
}

/** Situation financière complète d'un élève pour une année scolaire. */
export async function getEleveSituation(
  eleveId: string,
  anneeScolaire?: string,
): Promise<EleveSituation | null> {
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: ELEVE_INCLUDE,
  });
  if (!eleve) return null;

  const annee = anneeScolaire?.trim() || anneeScolaireCourante();

  await ensureFinanceDefaults(eleve.ecoleId);

  const [categories, modes, paiements] = await Promise.all([
    prisma.fraisCategorie.findMany({
      where: { ecoleId: eleve.ecoleId ?? null, actif: true },
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    }),
    prisma.modePaiementFrais.findMany({
      where: { ecoleId: eleve.ecoleId ?? null, actif: true },
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    }),
    prisma.paiementFrais.findMany({
      where: { eleveId, anneeScolaire: annee, statut: 'VALIDE' },
      orderBy: { dateOperation: 'desc' },
    }),
  ]);

  const frais: FraisSituationRow[] = categories.map((categorie) => {
    const paye = paiements
      .filter((p) => p.categorieId === categorie.id)
      .reduce((total, p) => total + p.montant, 0);
    return {
      categorieId: categorie.id,
      nom: categorie.nom,
      montant: categorie.montant,
      paye,
      solde: Math.max(0, categorie.montant - paye),
      statut: statutFor(categorie.montant, paye),
    };
  });

  // Paiements rattachés à une catégorie désactivée ou supprimée : conservés dans
  // une ligne dédiée pour que les totaux restent justes.
  const knownIds = new Set(categories.map((categorie) => categorie.id));
  const orphelins = paiements.filter((p) => !p.categorieId || !knownIds.has(p.categorieId));
  if (orphelins.length > 0) {
    const paye = orphelins.reduce((total, p) => total + p.montant, 0);
    frais.push({
      categorieId: orphelins[0].categorieId,
      nom: orphelins[0].categorieNom || 'Autres frais',
      montant: paye,
      paye,
      solde: 0,
      statut: 'PAYE',
    });
  }

  const totaux = frais.reduce(
    (acc, row) => ({
      aPayer: acc.aPayer + row.montant,
      paye: acc.paye + row.paye,
      solde: acc.solde + row.solde,
    }),
    { aPayer: 0, paye: 0, solde: 0 },
  );

  return {
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      postNom: eleve.postNom,
      prenom: eleve.prenom,
      classe: eleve.classe,
      photoUrl: await resolveFileUrl(eleve.photoUrl, { signed: true }),
      ecoleId: eleve.ecoleId,
      ecole: eleve.ecole?.nom ?? null,
      anneeScolaire: annee,
    },
    frais,
    totaux,
    paiements: paiements.map((paiement) => ({
      id: paiement.id,
      recuNumero: paiement.recuNumero,
      categorieNom: paiement.categorieNom,
      montant: paiement.montant,
      soldeApres: paiement.soldeApres,
      modePaiement: paiement.modePaiement,
      referenceTransaction: paiement.referenceTransaction,
      dateOperation: paiement.dateOperation.toISOString(),
      enregistreParNom: paiement.enregistreParNom,
    })),
    modesPaiement: modes.map((mode) => mode.nom),
  };
}

/** Numéro unique de reçu, ex. « REC-2026-4F9C2A ». */
export function createRecuNumero(date = new Date()): string {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `REC-${date.getFullYear()}-${suffix}`;
}

export type EnregistrerPaiementInput = {
  eleveId: string;
  categorieId?: string | null;
  montant: number;
  modePaiement?: string;
  referenceTransaction?: string;
  anneeScolaire?: string;
  dateOperation?: string;
  idempotencyKey?: string | null;
  enregistreParId: string;
  enregistreParNom: string;
};

/**
 * Enregistre un paiement de frais scolaire et renvoie le reçu.
 *
 * Idempotent : une même `idempotencyKey` (paiement saisi hors connexion puis
 * synchronisé deux fois) renvoie le paiement déjà créé au lieu d'un doublon.
 */
export async function enregistrerPaiementFrais(input: EnregistrerPaiementInput) {
  const montant = Math.round(Number(input.montant));
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false as const, error: 'Le montant payé doit être supérieur à zéro.' };
  }

  const idempotencyKey = input.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const existing = await prisma.paiementFrais.findUnique({ where: { idempotencyKey } });
    if (existing) return { ok: true as const, paiement: existing, duplicate: true };
  }

  const eleve = await prisma.eleve.findUnique({
    where: { id: input.eleveId },
    select: { id: true, ecoleId: true },
  });
  if (!eleve) return { ok: false as const, error: 'Élève introuvable.' };

  const anneeScolaire = input.anneeScolaire?.trim() || anneeScolaireCourante();
  const categorie = input.categorieId
    ? await prisma.fraisCategorie.findUnique({ where: { id: input.categorieId } })
    : null;
  if (input.categorieId && !categorie) {
    return { ok: false as const, error: 'Frais introuvable.' };
  }

  const dejaPaye = categorie
    ? await prisma.paiementFrais.aggregate({
        where: {
          eleveId: eleve.id,
          categorieId: categorie.id,
          anneeScolaire,
          statut: 'VALIDE',
        },
        _sum: { montant: true },
      })
    : null;
  const soldeApres = categorie
    ? Math.max(0, categorie.montant - ((dejaPaye?._sum.montant ?? 0) + montant))
    : 0;

  const dateOperation = input.dateOperation ? new Date(input.dateOperation) : new Date();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const paiement = await prisma.paiementFrais.create({
        data: {
          recuNumero: createRecuNumero(dateOperation),
          idempotencyKey,
          eleveId: eleve.id,
          categorieId: categorie?.id ?? null,
          categorieNom: categorie?.nom ?? 'Autres frais',
          anneeScolaire,
          montant,
          soldeApres,
          modePaiement: input.modePaiement?.trim() || 'Espèces',
          referenceTransaction: input.referenceTransaction?.trim() || '',
          dateOperation: Number.isNaN(dateOperation.getTime()) ? new Date() : dateOperation,
          enregistreParId: input.enregistreParId,
          enregistreParNom: input.enregistreParNom,
          ecoleId: eleve.ecoleId,
        },
      });
      return { ok: true as const, paiement, duplicate: false };
    } catch (err: any) {
      // Collision sur le numéro de reçu ou sur la clé d'idempotence.
      if (err?.code === 'P2002' && String(err?.meta?.target ?? '').includes('idempotencyKey')) {
        const existing = idempotencyKey
          ? await prisma.paiementFrais.findUnique({ where: { idempotencyKey } })
          : null;
        if (existing) return { ok: true as const, paiement: existing, duplicate: true };
      }
      if (err?.code === 'P2002' && attempt < 4) continue;
      throw err;
    }
  }

  return { ok: false as const, error: "Enregistrement du paiement impossible." };
}

/** Nom affiché de l'utilisateur qui enregistre une opération. */
export function displayUserName(user: { nom: string; postNom?: string | null; prenom: string }): string {
  return `${user.nom} ${user.postNom ?? ''} ${user.prenom}`.replace(/\s+/g, ' ').trim();
}
