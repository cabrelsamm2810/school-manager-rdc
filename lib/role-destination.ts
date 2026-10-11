/**
 * Destination d'ouverture selon le rôle déjà enregistré dans le compte.
 *
 * Aucun rôle, aucune permission et aucune donnée ne sont modifiées : il s'agit
 * uniquement de routes déjà présentes dans l'application, toutes accessibles au
 * rôle concerné. `/dashboard` adapte son contenu au périmètre du rôle
 * (national, provincial, sous-provincial, école) côté serveur.
 */
const ROLE_DESTINATION: Record<string, string> = {
  /* Espaces dédiés par rôle exact. */
  ELEVE: '/profile',
  ENSEIGNANT: '/enseignant/dashboard',
  SUPER_ADMIN: '/admin',
  ADMIN_SCHOOL_MANAGER_RDC: '/admin-smd',
  COORDINATION_NATIONALE: '/coordination-nationale',
  COORDINATION_PROVINCIALE: '/coordination-provinciale',
  COORDINATION_SOUS_PROVINCIALE: '/coordination-sous-provinciale',
  PROMOTEUR: '/promoteur',
  SECRETAIRE: '/secretaire',
  COMPTABLE: '/comptable',
  VISITEUR: '/about',
};

const DEFAULT_DESTINATION = '/dashboard';

export function getRoleDestination(role?: string | null): string {
  if (!role) return DEFAULT_DESTINATION;
  return ROLE_DESTINATION[role] ?? DEFAULT_DESTINATION;
}
