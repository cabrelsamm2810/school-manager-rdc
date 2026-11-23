/**
 * Résumé lisible des permissions d'un rôle, affiché dans l'inscription.
 *
 * Source de vérité : `ROLE_PERMISSIONS` (lib/permissions.ts). Ce module ne
 * redéfinit aucune permission — il regroupe seulement les codes accordés par
 * domaine pour les présenter à l'utilisateur.
 */

import { ROLE_PERMISSIONS } from '@/lib/permissions';
import { ROLE_LABELS } from '@/lib/roles';

const DOMAIN_LABELS: Record<string, string> = {
  'school:': 'Gestion de l’établissement',
  'teacher:': 'Espace enseignant',
  'secretary:': 'Secrétariat',
  'comptable:': 'Comptabilité',
  'student:': 'Espace élève',
  'parent:': 'Espace parent',
  'promoteur:': 'Promotion de l’établissement',
  'chat:': 'Messagerie SchoolChat',
  'notifications:': 'Notifications',
};

export type RolePermissionSummary = {
  roleLabel: string;
  items: string[];
};

/** Regroupe les permissions du rôle par domaine, dans l'ordre de déclaration. */
export function describeRolePermissions(role: string | null | undefined): RolePermissionSummary {
  if (!role) return { roleLabel: '', items: [] };
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  const seen = new Set<string>();
  const items: string[] = [];

  for (const permission of permissions) {
    const separator = permission.indexOf(':');
    if (separator === -1) continue;
    const domain = permission.slice(0, separator + 1);
    const label = DOMAIN_LABELS[domain];
    if (!label || seen.has(label)) continue;
    seen.add(label);
    items.push(label);
  }

  return { roleLabel: ROLE_LABELS[role] ?? role, items };
}
