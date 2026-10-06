/**
 * Rôles et hiérarchie RBAC de School Manager RDC.
 *
 * Module volontairement sans dépendance (ni Prisma, ni `next/server`) : il est
 * importable par le middleware (edge) comme par les composants clients.
 * `lib/rbac.ts` ré-exporte ces deux constantes pour ses appelants existants.
 */

/**
 * Hiérarchie des rôles RBAC.
 * Plus le rang est élevé, plus l'utilisateur a de privilèges.
 */
export const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN: 10,
  COORDINATION_NATIONALE: 9,
  COORDINATION_PROVINCIALE: 8,
  AGENT_PROVINCIAL: 7,
  COORDINATION_SOUS_PROVINCIALE: 6,
  AGENT_SOUS_PROVINCIAL: 5,
  DIRECTION_ECOLE: 4,
  ENSEIGNANT: 3,
  PARENT: 2,
  ELEVE: 1
};

/** Labels affichables pour chaque rôle. */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  COORDINATION_NATIONALE: 'Coordination nationale',
  COORDINATION_PROVINCIALE: 'Coordination provinciale',
  AGENT_PROVINCIAL: 'Agent provincial',
  COORDINATION_SOUS_PROVINCIALE: 'Coordination sous provinciale',
  AGENT_SOUS_PROVINCIAL: 'Agent sous provincial',
  DIRECTION_ECOLE: 'Chef d’établissement',
  ENSEIGNANT: 'Enseignant',
  PARENT: 'Parent',
  ELEVE: 'Élève'
};
