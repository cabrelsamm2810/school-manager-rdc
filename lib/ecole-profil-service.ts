import 'server-only';

import { randomBytes } from 'node:crypto';
import prisma from '@/lib/prisma';
import { ECOLE_QR_TOKEN_LENGTH, buildEcoleQrValue, generateCodeEcole } from '@/lib/ecole-profil';

/**
 * Service du Profil École.
 *
 * Source unique utilisée par les routes `/api/ecole-profil/*` : un autre module
 * qui a besoin des informations administratives d'une école réutilise ces
 * helpers plutôt que de relire `Ecole` à sa manière.
 */

import { canAccessEcole, canEditEcoleProfil, type ProfilUtilisateur } from '@/lib/ecole-profil-access';

// Les règles d'accès vivent dans un module pur (testable sans base) et sont
// ré-exportées ici pour les routes qui importent le service.
export { canAccessEcole, canEditEcoleProfil } from '@/lib/ecole-profil-access';
export type { EcolePerimetre, ProfilUtilisateur } from '@/lib/ecole-profil-access';

export function generateQrToken(): string {
  return randomBytes(ECOLE_QR_TOKEN_LENGTH / 2).toString('hex');
}

function userName(user: ProfilUtilisateur): string {
  return [user.nom, user.postNom, user.prenom].filter(Boolean).join(' ').trim() || user.id;
}

export type HistoriqueEntry = {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  champ?: string;
  ancienneValeur?: string;
  nouvelleValeur?: string;
};

/** Écrit une entrée d'historique sans jamais bloquer l'action principale. */
export async function logEcoleProfil(ecoleId: string, user: ProfilUtilisateur, entry: Omit<HistoriqueEntry, 'userId' | 'userName' | 'userRole'>) {
  try {
    await prisma.ecoleProfilHistorique.create({
      data: {
        ecoleId,
        userId: user.id,
        userName: userName(user),
        userRole: user.role,
        action: entry.action,
        champ: entry.champ ?? '',
        ancienneValeur: entry.ancienneValeur ?? '',
        nouvelleValeur: entry.nouvelleValeur ?? '',
      },
    });
  } catch {
    /* L'historique ne doit jamais bloquer l'enregistrement. */
  }
}

async function uniqueCodeEcole(institution: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCodeEcole(institution);
    const exists = await prisma.ecoleProfil.findUnique({ where: { codeEcole: code }, select: { id: true } });
    if (!exists) return code;
  }
  // Repli déterministe improbable : suffixe horodaté.
  return generateCodeEcole(institution).replace(/\d{6}$/, String(Date.now()).slice(-6));
}

/**
 * Récupère le profil d'une école, en le créant au premier accès
 * (code école + jeton QR + rattachement automatique du chef si un compte
 * DIRECTION_ECOLE est déjà lié à l'école).
 *
 * Opération idempotente : aucune donnée existante n'est supprimée.
 */
export async function ensureEcoleProfil(ecoleId: string, institution: string, user: ProfilUtilisateur) {
  const existing = await prisma.ecoleProfil.findUnique({ where: { ecoleId } });
  if (existing) return existing;

  // Rattachement automatique : premier compte actif DIRECTION_ECOLE de l'école.
  const chef = await prisma.user.findFirst({
    where: { ecoleId, role: 'DIRECTION_ECOLE', isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  const chefLibre = chef
    ? !(await prisma.ecoleProfil.findUnique({ where: { chefUserId: chef.id }, select: { id: true } }))
    : false;

  const profil = await prisma.ecoleProfil.create({
    data: {
      ecoleId,
      codeEcole: await uniqueCodeEcole(institution),
      qrToken: generateQrToken(),
      chefUserId: chefLibre ? chef!.id : null,
    },
  });

  await logEcoleProfil(ecoleId, user, {
    action: 'CREATION',
    champ: 'codeEcole',
    nouvelleValeur: profil.codeEcole,
  });
  if (profil.chefUserId) {
    await logEcoleProfil(ecoleId, user, { action: 'CHEF_ASSOCIE', champ: 'chefUserId', nouvelleValeur: profil.chefUserId });
  }
  return profil;
}

/** Charge une école et vérifie le périmètre de l'utilisateur. */
export async function loadEcoleAutorisee(user: ProfilUtilisateur, ecoleId?: string | null) {
  const targetId = ecoleId || user.ecoleId;
  if (!targetId) {
    return { ok: false as const, status: 404, error: 'Aucune école n’est rattachée à ce compte.' };
  }

  const ecole = await prisma.ecole.findUnique({
    where: { id: targetId },
    include: {
      coordSousProvinciale: { select: { id: true, nom: true } },
      ecErc: { select: { id: true, nom: true } },
    },
  });
  if (!ecole) return { ok: false as const, status: 404, error: 'École introuvable.' };

  if (!canAccessEcole(user, ecole)) {
    return { ok: false as const, status: 403, error: 'Accès refusé : cette école est hors de votre périmètre.' };
  }
  return { ok: true as const, ecole };
}

/**
 * Charge toutes les données du Profil École : fiche administrative, profil
 * (code école + jeton QR), chef associé, sections et valeur du QR Code.
 *
 * Partagé par `GET /api/ecole-profil` et l'export PDF.
 */
export async function loadEcoleProfilPayload(ecoleId: string, user: ProfilUtilisateur) {
  const ecole = await prisma.ecole.findUnique({
    where: { id: ecoleId },
    include: {
      coordSousProvinciale: { select: { id: true, nom: true } },
      ecErc: { select: { id: true, nom: true } },
    },
  });
  if (!ecole) return null;

  const profil = await ensureEcoleProfil(ecole.id, ecole.institution, user);

  const [chef, sections] = await Promise.all([
    profil.chefUserId
      ? prisma.user.findUnique({
          where: { id: profil.chefUserId },
          select: { id: true, nom: true, postNom: true, prenom: true, email: true, telephone: true, profilePhotoUrl: true },
        })
      : Promise.resolve(null),
    prisma.ecoleSection.findMany({
      where: { ecoleId: ecole.id },
      orderBy: [{ type: 'asc' }, { ordre: 'asc' }, { nom: 'asc' }],
    }),
  ]);

  return {
    ecole: {
      id: ecole.id,
      nom: ecole.nom,
      type: ecole.type,
      institution: ecole.institution,
      dinacope: ecole.dinacope,
      province: ecole.province,
      provinceEducationnelle: ecole.provinceEducationnelle,
      ville: ecole.ville,
      commune: ecole.commune,
      adresse: ecole.adresse,
      telephone: ecole.telephone,
      email: ecole.email,
      chefEcole: ecole.chefEcole,
      logoUrl: ecole.logoUrl,
      identifiantSM: ecole.identifiantSM,
      effectif: ecole.effectif,
      statut: ecole.statut,
      statutValidation: ecole.statutValidation,
      coordSousProvinciale: ecole.coordSousProvinciale,
      ecErc: ecole.ecErc,
    },
    profil: {
      id: profil.id,
      codeEcole: profil.codeEcole,
      chefUserId: profil.chefUserId,
      statut: profil.statut,
      createdAt: profil.createdAt,
      updatedAt: profil.updatedAt,
    },
    chef,
    sections,
    qrPayload: buildEcoleQrValue(profil.codeEcole, profil.qrToken),
    permissions: {
      canEdit: canEditEcoleProfil(user, ecole),
    },
  };
}
