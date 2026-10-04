import { ROLE_RANK } from '@/lib/rbac';

type AuthUser = {
  id: string;
  role: string;
  provinceAdministrative?: string;
};

/**
 * Renvoie true si l'utilisateur a un accès national (voit toutes les données).
 */
export function isNationalScope(role: string): boolean {
  return (ROLE_RANK[role] ?? 0) >= ROLE_RANK['COORDINATION_NATIONALE'];
}

/**
 * Construit un fragment `where` Prisma pour filtrer par province.
 * - SUPER_ADMIN / COORDINATION_NATIONALE : aucun filtre (accès national)
 * - Autres rôles : filtre sur le champ `province` avec la province de l'utilisateur
 *
 * @param user  L'utilisateur authentifié (doit contenir provinceAdministrative)
 * @param field Nom du champ province dans le modèle (défaut: 'province')
 */
export function provinceWhere(
  user: AuthUser | null,
  field = 'province',
): Record<string, unknown> {
  if (!user || isNationalScope(user.role)) return {};
  const prov = user.provinceAdministrative;
  if (!prov) return {};
  return { [field]: prov };
}

/**
 * Fusionne un `where` existant avec le filtre de province.
 * Gère correctement les clauses OR déjà présentes.
 */
export function mergeProvinceFilter(
  baseWhere: Record<string, unknown>,
  user: AuthUser | null,
  field = 'province',
): Record<string, unknown> {
  const provFilter = provinceWhere(user, field);
  if (Object.keys(provFilter).length === 0) return baseWhere;
  return { AND: [baseWhere, provFilter] };
}
