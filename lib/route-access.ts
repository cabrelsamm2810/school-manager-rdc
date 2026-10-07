import { ROLE_RANK } from '@/lib/roles';

/**
 * Règles d'accès aux routes de l'application.
 *
 * Source unique partagée par `middleware.ts` (qui redirige réellement) et par
 * les raccourcis codés en dur (`QuickActions`, `BottomNav`, tableaux de bord) :
 * un lien affiché ne peut donc plus pointer vers une route fermée au rôle.
 */

/** Mapping route → rôle minimum requis. */
export const ROUTE_MIN_ROLE: Record<string, string> = {
  '/ecoles': 'DIRECTION_ECOLE',
  '/eleves': 'DIRECTION_ECOLE',
  '/enseignants': 'DIRECTION_ECOLE',
  '/enseignant/dashboard': 'ENSEIGNANT',
  '/cahier-de-cote': 'ENSEIGNANT',
  '/cahier-de-notes': 'ENSEIGNANT',
  '/mes-cours': 'ENSEIGNANT',
  '/journal-de-classe': 'ENSEIGNANT',
  '/cahier-de-communication': 'ENSEIGNANT',
  '/presences-qr': 'ENSEIGNANT',
  '/pointage-qr': 'DIRECTION_ECOLE',
  '/mes-eleves': 'ENSEIGNANT',
  '/scanner-eleve': 'ENSEIGNANT',
  '/rappels-cotes': 'DIRECTION_ECOLE',
  '/recherche-eleves': 'DIRECTION_ECOLE',
  '/carte-scolaire': 'DIRECTION_ECOLE',
  '/photo-passeport': 'DIRECTION_ECOLE',
  '/cartes-qr': 'DIRECTION_ECOLE',
  '/bulletin-numerique': 'DIRECTION_ECOLE',
  '/dossiers-eleves': 'DIRECTION_ECOLE',
  '/classes-rdc': 'DIRECTION_ECOLE',
  '/matieres-rdc': 'DIRECTION_ECOLE',
  '/options-rdc': 'DIRECTION_ECOLE',
  '/import': 'DIRECTION_ECOLE',
  '/provinces-educationnelles': 'COORDINATION_PROVINCIALE',
  '/sous-divisions': 'COORDINATION_PROVINCIALE',
  '/provinces': 'COORDINATION_PROVINCIALE',
  '/ec-erc': 'COORDINATION_PROVINCIALE',
  '/coordination-nationale': 'COORDINATION_NATIONALE',
  '/coordination-provinciale': 'COORDINATION_PROVINCIALE',
  '/coordination-sous-provinciale': 'COORDINATION_SOUS_PROVINCIALE',
  '/admin-smd/ecoles': 'ADMIN_SCHOOL_MANAGER_RDC',
  '/admin/users': 'ADMIN_SCHOOL_MANAGER_RDC',
  '/bureaux-fonctions': 'COORDINATION_PROVINCIALE',
  '/grades': 'COORDINATION_PROVINCIALE',
  '/dossiers': 'AGENT_PROVINCIAL',
  '/visites': 'AGENT_SOUS_PROVINCIAL',
  '/services': 'AGENT_SOUS_PROVINCIAL',
  '/admin': 'SUPER_ADMIN',
  '/admin-smd': 'ADMIN_SCHOOL_MANAGER_RDC',
  '/promoteur': 'PROMOTEUR',
  '/secretaire': 'SECRETAIRE',
  '/comptable': 'COMPTABLE',
  '/paiements': 'COMPTABLE',
};

/**
 * Routes réservées à un rôle EXACT (pas de règle de rang) : les espaces propres
 * à un rôle (tableau de bord enseignant, espaces de coordination) ne doivent pas
 * s'ouvrir aux rôles supérieurs (direction, coordination, administration).
 */
export const ROUTE_EXACT_ROLE: Record<string, string> = {
  '/enseignant/dashboard': 'ENSEIGNANT',
  '/coordination-nationale': 'COORDINATION_NATIONALE',
  '/coordination-provinciale': 'COORDINATION_PROVINCIALE',
  '/coordination-sous-provinciale': 'COORDINATION_SOUS_PROVINCIALE',
  '/admin': 'SUPER_ADMIN',
  '/admin-smd': 'ADMIN_SCHOOL_MANAGER_RDC',
  '/promoteur': 'PROMOTEUR',
  '/secretaire': 'SECRETAIRE',
  '/comptable': 'COMPTABLE',
};

/** Trouve la règle applicable à un chemin : correspondance exacte, puis préfixe. */
function matchRoute(map: Record<string, string>, pathname: string): string | undefined {
  if (map[pathname]) return map[pathname];
  const sorted = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname === route || pathname.startsWith(route + '/')) return map[route];
  }
  return undefined;
}

/** Rôle exact imposé à un chemin donné (gère les préfixes). */
export function getExactRoleForPath(pathname: string): string | undefined {
  // Si le chemin a une entrée exacte dans ROUTE_MIN_ROLE mais pas dans
  // ROUTE_EXACT_ROLE, on n'applique pas la restriction de rôle exact du parent.
  // Exemple : /admin/users a minRole ADMIN_SCHOOL_MANAGER_RDC mais pas de
  // rôle exact → ne pas hériter de ROUTE_EXACT_ROLE['/admin'] = SUPER_ADMIN.
  if (ROUTE_MIN_ROLE[pathname] && !ROUTE_EXACT_ROLE[pathname]) {
    return undefined;
  }
  return matchRoute(ROUTE_EXACT_ROLE, pathname);
}

/** Rôle minimum exigé pour un chemin donné (gère les préfixes). */
export function getMinRoleForPath(pathname: string): string | undefined {
  return matchRoute(ROUTE_MIN_ROLE, pathname);
}

/** Un rôle peut-il ouvrir ce chemin ? (rôle exact, puis rôle minimum) */
export function canAccessPath(role: string | null | undefined, pathname: string): boolean {
  if (!role) return false;

  const exactRole = getExactRoleForPath(pathname);
  if (exactRole && role !== exactRole) return false;

  const requiredRole = getMinRoleForPath(pathname);
  if (requiredRole && (ROLE_RANK[role] ?? 0) < (ROLE_RANK[requiredRole] ?? 0)) return false;

  return true;
}
