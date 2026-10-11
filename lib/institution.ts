/**
 * Libellé d'école affiché dans les cartes du tableau de bord.
 * Source unique, partagée par la carte de bienvenue et la carte montre :
 * aucun libellé n'est inventé, tout vient des données de la session servie
 * par le serveur (nom réel ou type d'institution).
 */

export const INSTITUTION_LABELS: Record<string, string> = {
  'EC-ERC': 'EC-ERC',
  PUBLIQUE: 'École publique',
  CATHOLIQUE: 'École catholique',
  ISLAMIQUE: 'École islamique',
  INDEPENDANTE: 'École indépendante'
};

export function getInstitutionLabel(
  user: { institutionName?: string | null; typeInstitution?: string | null } | null | undefined
): string | null {
  if (!user) return null;
  if (user.institutionName) return user.institutionName;
  if (user.typeInstitution) return INSTITUTION_LABELS[user.typeInstitution] ?? user.typeInstitution;
  return null;
}
