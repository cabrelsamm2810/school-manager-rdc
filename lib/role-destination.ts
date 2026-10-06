/**
 * Destination d'ouverture selon le rôle déjà enregistré dans le compte.
 *
 * Aucun rôle, aucune permission et aucune donnée ne sont modifiés : il s'agit
 * uniquement de routes déjà présentes dans l'application, toutes accessibles au
 * rôle concerné. `/dashboard` adapte son contenu au périmètre du rôle
 * (national, provincial, sous-provincial, établissement) côté serveur.
 */
const ROLE_DESTINATION: Record<string, string> = {
  /* Espace élève : logique de redirection déjà existante, conservée telle quelle. */
  ELEVE: '/profile',
  /* Tableau de bord enseignant déjà présent dans l'application. */
  ENSEIGNANT: '/enseignant/dashboard'
};

const DEFAULT_DESTINATION = '/dashboard';

export function getRoleDestination(role?: string | null): string {
  if (!role) return DEFAULT_DESTINATION;
  return ROLE_DESTINATION[role] ?? DEFAULT_DESTINATION;
}
