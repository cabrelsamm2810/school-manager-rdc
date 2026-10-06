import { ROLE_RANK } from '@/lib/rbac';

export type AuthUser = {
  id: string;
  role: string;
  provinceAdministrative?: string;
  coordSousProvincialeId?: string | null;
  etablissementId?: string | null;
  typeInstitution?: string;
  institutionName?: string;
};

export type ScopeLevel = 'national' | 'provincial' | 'sousProvincial' | 'school';

export type ScopeConfig = {
  /** Champ du modèle correspondant à la province (défaut: 'province'). Mettre à false pour désactiver le filtre. */
  provinceField?: string | false;
  /** Champ du modèle correspondant à coordSousProvincialeId (FK). Utiliser 'id' si le modèle EST CoordSousProvinciale. */
  sousProvincialeField?: string;
  /** Champ du modèle correspondant à etablissementId (FK). Utiliser 'id' si le modèle EST Etablissement. */
  etablissementField?: string;
  /** Champ du modèle correspondant à l'institution (défaut: 'institution'). Mettre à false pour désactiver le filtre. */
  institutionField?: string | false;
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
  const where: Record<string, unknown> = {};

  // ── Filtre par institution (isolation des données entre les 5 types) ──
  // SUPER_ADMIN voit tout ; tous les autres sont limités à leur institution.
  const instField = config.institutionField !== undefined ? config.institutionField : 'institution';
  if (instField && user.role !== 'SUPER_ADMIN' && user.typeInstitution) {
    where[instField] = user.typeInstitution;
  }

  if (scope === 'national') return where;

  // Certains modèles n'ont aucun champ territorial (provinceField: false) :
  // ils ne peuvent pas être filtrés par périmètre.
  const provinceField = config.provinceField === false ? null : config.provinceField ?? 'province';

  if (scope === 'provincial') {
    const prov = user.provinceAdministrative;
    if (provinceField && prov) where[provinceField] = prov;
    return where;
  }

  if (scope === 'sousProvincial') {
    // Filtrer par la sous-division spécifique si le modèle le permet
    if (config.sousProvincialeField && user.coordSousProvincialeId) {
      where[config.sousProvincialeField] = user.coordSousProvincialeId;
    } else {
      // Sinon, repli sur la province
      const prov = user.provinceAdministrative;
      if (provinceField && prov) where[provinceField] = prov;
    }
    return where;
  }

  // school : DIRECTION_ECOLE, ENSEIGNANT
  if (config.etablissementField && user.etablissementId) {
    where[config.etablissementField] = user.etablissementId;
  } else {
    // Repli sur la province pour les modèles sans lien direct à un établissement
    const prov = user.provinceAdministrative;
    if (provinceField && prov) where[provinceField] = prov;
  }
  return where;
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
