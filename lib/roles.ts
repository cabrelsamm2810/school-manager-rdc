/**
 * Rôles et hiérarchie RBAC de School Manager RDC.
 *
 * Module volontairement sans dépendance (ni Prisma, ni `next/server`) : il est
 * importable par le middleware (edge) comme par les composants clients.
 * `lib/rbac.ts` ré-exporte ces deux constantes pour ses appelants existants.
 */

/**
 * Hiérarchie des rôles RBAC — 15 rôles.
 * Plus le rang est élevé, plus l'utilisateur a de privilèges.
 * Principe : DENY BY DEFAULT. Toute permission non explicitement accordée est refusée.
 */
export const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN: 15,
  ADMIN_SCHOOL_MANAGER_RDC: 14,
  COORDINATION_NATIONALE: 13,
  COORDINATION_PROVINCIALE: 12,
  AGENT_PROVINCIAL: 11,
  COORDINATION_SOUS_PROVINCIALE: 10,
  AGENT_SOUS_PROVINCIAL: 9,
  PROMOTEUR: 8,
  DIRECTION_ECOLE: 7,
  SECRETAIRE: 6,
  COMPTABLE: 5,
  ENSEIGNANT: 4,
  PARENT: 3,
  ELEVE: 2,
  VISITEUR: 1
};

/** Labels affichables pour chaque rôle. */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN_SCHOOL_MANAGER_RDC: 'Admin School Manager RDC',
  COORDINATION_NATIONALE: 'Coordination nationale',
  COORDINATION_PROVINCIALE: 'Coordination provinciale',
  AGENT_PROVINCIAL: 'Agent provincial',
  COORDINATION_SOUS_PROVINCIALE: 'Coordination sous-provinciale',
  AGENT_SOUS_PROVINCIAL: 'Agent de coordination sous-provinciale',
  PROMOTEUR: 'Promoteur',
  DIRECTION_ECOLE: 'Chef d\u2019établissement',
  SECRETAIRE: 'Secrétaire',
  COMPTABLE: 'Comptable',
  ENSEIGNANT: 'Enseignant',
  PARENT: 'Parent / Tuteur',
  ELEVE: 'Élève',
  VISITEUR: 'Visiteur / Invité'
};

/** Rôles pouvant être créés depuis le formulaire public d'inscription.
 *  SUPER_ADMIN et ADMIN_SCHOOL_MANAGER_RDC en sont exclus : ils ne peuvent
 *  être créés que par un Super Administrateur existant. */
export const SELF_REGISTER_ROLES = [
  'ELEVE',
  'PARENT',
  'ENSEIGNANT',
  'COMPTABLE',
  'SECRETAIRE',
  'DIRECTION_ECOLE',
  'PROMOTEUR',
  'AGENT_SOUS_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_PROVINCIALE',
  'COORDINATION_NATIONALE',
] as const;

/** Rôles réservés : ne peuvent être assignés que par un Super Administrateur. */
export const RESTRICTED_ROLES = ['SUPER_ADMIN', 'ADMIN_SCHOOL_MANAGER_RDC'] as const;
