/**
 * Types partagés du module « frais scolaires » (serveur et navigateur).
 * Aucune dépendance Prisma : importable par les composants clients.
 */

export type FraisSituationRow = {
  categorieId: string | null;
  nom: string;
  montant: number;
  paye: number;
  solde: number;
  statut: 'PAYE' | 'PARTIEL' | 'EN_ATTENTE';
};

export type PaiementHistorique = {
  id: string;
  recuNumero: string;
  categorieNom: string;
  montant: number;
  soldeApres: number;
  modePaiement: string;
  referenceTransaction: string;
  dateOperation: string;
  enregistreParNom: string;
};

export type EleveSituation = {
  eleve: {
    id: string;
    matricule: string;
    nom: string;
    postNom: string;
    prenom: string;
    classe: string;
    photoUrl: string | null;
    ecoleId: string | null;
    ecole: string | null;
    anneeScolaire: string;
  };
  frais: FraisSituationRow[];
  totaux: { aPayer: number; paye: number; solde: number };
  paiements: PaiementHistorique[];
  modesPaiement: string[];
};

/** Paiement saisi hors connexion, en attente de synchronisation. */
export type PendingPaiement = {
  idempotencyKey: string;
  eleveId: string;
  eleveNom: string;
  categorieId: string | null;
  categorieNom: string;
  montant: number;
  modePaiement: string;
  referenceTransaction: string;
  anneeScolaire: string;
  dateOperation: string;
};

/** Reçu numérique affiché après enregistrement d'un paiement. */
export type RecuPaiement = {
  recuNumero: string;
  categorieNom: string;
  montant: number;
  soldeApres: number;
  modePaiement: string;
  referenceTransaction: string;
  dateOperation: string;
  enregistreParNom: string;
  anneeScolaire: string;
};

export function formatMontant(montant: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(montant || 0))} FC`;
}

export function formatDateHeure(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
