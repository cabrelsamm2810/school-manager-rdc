/**
 * Logique de détection des enseignants retardataires et envoi de rappels.
 * Un enseignant est considéré "en retard" s'il n'a aucune saisie
 * dans cahier_de_cote pour la période en cours.
 */

import prisma from './prisma';
import { PERIODES, getCurrentAnneeScolaire } from './cahier-de-cote';

/** Détermine la période en cours selon le mois courant. */
export function getCurrentPeriode(): string {
  const month = new Date().getMonth() + 1; // 1-12
  // Septembre–Novembre → 1er Trimestre
  if (month >= 9 || month <= 2) return PERIODES[0]; // 1er Trimestre (couvre sept-fév pour la démo)
  if (month >= 3 && month <= 5) return PERIODES[1]; // 2e Trimestre
  return PERIODES[2]; // 3e Trimestre (juin-août)
}

export interface EnseignantRetardataire {
  id: string;
  nom: string;
  matricule: string;
  email: string;
  ecole: string;
  telephone: string;
}

export interface RappelStatut {
  periode: string;
  anneeScolaire: string;
  total: number;
  aJour: number;
  enRetard: number;
  retardataires: EnseignantRetardataire[];
}

/**
 * Renvoie les enseignants actifs qui n'ont AUCUNE saisie
 * dans cahier_de_cote pour la période et l'année scolaire données.
 */
export async function getEnseignantsEnRetard(
  periode: string,
  anneeScolaire: string,
): Promise<EnseignantRetardataire[]> {
  // Tous les enseignants actifs
  const enseignants = await prisma.enseignant.findMany({
    where: { statut: 'Actif' },
    orderBy: { nom: 'asc' },
  });

  if (enseignants.length === 0) return [];

  // Noms des enseignants qui ont déjà saisi au moins une cote pour cette période
  const saisies = await prisma.cahierDeCote.findMany({
    where: { periode, anneeScolaire },
    select: { enseignantNom: true },
    distinct: ['enseignantNom'],
  });

  const nomsAJour = new Set(saisies.map((s) => s.enseignantNom.trim().toLowerCase()));

  return enseignants
    .filter((e) => !nomsAJour.has(e.nom.trim().toLowerCase()))
    .map((e) => ({
      id: e.id,
      nom: e.nom,
      matricule: e.matricule,
      email: e.email,
      ecole: e.ecole,
      telephone: e.telephone,
    }));
}

/**
 * Statut complet: total, à jour, en retard + liste des retardataires.
 */
export async function getRappelStatut(
  periode: string,
  anneeScolaire: string,
): Promise<RappelStatut> {
  const total = await prisma.enseignant.count({ where: { statut: 'Actif' } });

  const saisies = await prisma.cahierDeCote.findMany({
    where: { periode, anneeScolaire },
    select: { enseignantNom: true },
    distinct: ['enseignantNom'],
  });

  const nomsAJour = new Set(saisies.map((s) => s.enseignantNom.trim().toLowerCase()));
  const aJour = await prisma.enseignant.count({
    where: {
      statut: 'Actif',
      // Count those whose name IS in the set — Prisma can't do set-membership directly,
      // so we fetch all and filter
    },
  });

  // Fetch all active enseignants to compute accurately
  const allActive = await prisma.enseignant.findMany({
    where: { statut: 'Actif' },
    select: { nom: true },
  });

  const countAJour = allActive.filter((e) => nomsAJour.has(e.nom.trim().toLowerCase())).length;
  const retardataires = await getEnseignantsEnRetard(periode, anneeScolaire);

  return {
    periode,
    anneeScolaire,
    total,
    aJour: countAJour,
    enRetard: retardataires.length,
    retardataires,
  };
}
