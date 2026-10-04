import { ROLE_RANK } from '@/lib/rbac';

export type AuthUser = {
  id: string;
  role: string;
  provinceAdministrative?: string;
  coordSousProvincialeId?: string | null;
  etablissementId?: string | null;
};

export type ScopeLevel = 'national' | 'provincial' | 'sousProvincial' | 'school';

export type ScopeConfig = {
  /** Champ du modèle correspondant à la province (défaut: 'province'). */
  provinceField?: string;
  /** Champ du modèle correspondant à coordSousProvincialeId (FK). Utiliser 'id' si le modèle EST CoordSousProvinciale. */
  sousProvincialeField?: string;
  /** Champ du modèle correspondant à etablissementId (FK). Utiliser 'id' si le modèle EST Etablissement. */
  etablissementField?: string;
};

/**
 * Détermine le niveau de périmètre d'un utilisateur selon son rôle.
 * - national : SUPER_ADMIN, COORDINATION_NATIONALE → voient tout
 * - provincial : COORDINATION_PROVINCIALE, AGENT_PROVINCIAL → voient leur province
 * - sousProvincial : COORDINATION_SOUS_PROVINCIALE, AGENT_SOUS_PROVINCIAL → voient leur sous-division
 * - school : DIRECTION_ECOLE, ENSEIGNANT → voient leur établissement
 */
export function getScopeLevel(role: string): ScopeLevel {
  const rank = ROLE_RANK[role] ?? 0;
  if (rank >= ROLE_RANK['COORDINATION_NATIONALE']) return 'national';
  if (rank >= ROLE_RANK['COORDINATION_PROVINCIALE']) return 'provincial';
  if (rank >= ROLE_RANK['COORDINATION_SOUS_PROVINCIALE']) return 'sousProvincial';
  return 'school';
}

/** Renvoie true si l'utilisateur a un accès national (voit toutes les données). */
export function isNationalScope(role: string): boolean {
  return getScopeLevel(role) === 'national';
}

/**
 * Construit un fragment `where` Prisma pour le filtrage hiérarchique.
 *
 * @param user   L'utilisateur authentifié
 * @param config Décrit quels champs du modèle correspondent à chaque niveau hiérarchique
 * @returns      Un objet `where` Prisma à fusionner avec les filtres existants
 */
export function buildScopeWhere(
  user: AuthUser | null,
  config: ScopeConfig = {},
): Record<string, unknown> {
  if (!user) return {};

  const scope = getScopeLevel(user.role);

  if (scope === 'national') return {};

  if (scope === 'provincial') {
    const prov = user.provinceAdministrative;
    if (!prov) return {};
    return { [config.provinceField ?? 'province']: prov };
  }

  if (scope === 'sousProvincial') {
    // Filtrer par la sous-division spécifique si le modèle le permet
    if (config.sousProvincialField && user.coordSousProvincialeId) {
      return { [config.sousProvincialField]: user.coordSousProvincialeId };
    }
    // Sinon, repli sur la province
    const prov = user.provinceAdministrative;
    if (!prov) return {};
    return { [config.provinceField ?? 'province']: prov };
  }

  // school : DIRECTION_ECOLE, ENSEIGNANT
  if (config.etablissementField && user.etablissementId) {
    return { [config.etablissementField]: user.etablissementId };
  }
  // Repli sur la province pour les modèles sans lien direct à un établissement
  const prov = user.provinceAdministrative;
  if (!prov) return {};
  return { [config.provinceField ?? 'province']: prov };
}

/**
 * Fusionne un `where` existant avec le filtre de périmètre hiérarchique.
 */
export function mergeScopeFilter(
  baseWhere: Record<string, unknown>,
  user: AuthUser | null,
  config: ScopeConfig = {},
): Record<string, unknown> {
  const scopeFilter = buildScopeWhere(user, config);
  if (Object.keys(scopeFilter).length === 0) return baseWhere;
  return { AND: [baseWhere, scopeFilter] };
}
