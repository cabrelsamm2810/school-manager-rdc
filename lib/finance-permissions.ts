/**
 * Permissions financières — School Manager RDC.
 *
 * Principe identique à `lib/permissions.ts` : DENY BY DEFAULT.
 * Un rôle sans entrée ici n'a AUCUNE permission financière — c'est le cas de
 * l'enseignant : il ne peut ni consulter un dossier financier ni enregistrer un
 * paiement, sauf si la permission lui a été accordée explicitement sur son
 * compte (`User.financePermissions`, lue par la session serveur).
 *
 * Module sans dépendance Prisma : importable par les routes API comme par les
 * composants clients.
 */

export const FINANCE_PERM = {
  /** Consulter la situation financière d'un élève (scan / recherche). */
  VIEW: 'finance:view',
  /** Enregistrer un paiement et générer un reçu. */
  PAY: 'finance:pay',
  /** Créer, modifier ou désactiver les catégories de frais et modes de paiement. */
  CONFIG: 'finance:config',
} as const;

export type FinancePermission = (typeof FINANCE_PERM)[keyof typeof FINANCE_PERM];

const ALL_FINANCE: FinancePermission[] = [
  FINANCE_PERM.VIEW,
  FINANCE_PERM.PAY,
  FINANCE_PERM.CONFIG,
];

/** Permissions financières accordées par défaut à chaque rôle. */
const ROLE_FINANCE_PERMISSIONS: Record<string, FinancePermission[]> = {
  SUPER_ADMIN: ALL_FINANCE,
  DIRECTION_ECOLE: ALL_FINANCE,
  PROMOTEUR: ALL_FINANCE,
  COMPTABLE: [FINANCE_PERM.VIEW, FINANCE_PERM.PAY],
};

export type FinanceUser = {
  role?: string | null;
  financePermissions?: string[] | null;
};

/** L'utilisateur peut-il effectuer cette opération financière ? */
export function canFinance(
  user: FinanceUser | null | undefined,
  permission: FinancePermission,
): boolean {
  if (!user) return false;
  if (user.financePermissions?.includes(permission)) return true;
  const rolePermissions = user.role ? ROLE_FINANCE_PERMISSIONS[user.role] : undefined;
  return rolePermissions ? rolePermissions.includes(permission) : false;
}

/** Permissions financières effectives (rôle + accords explicites). */
export function financePermissionsOf(user: FinanceUser | null | undefined): FinancePermission[] {
  return ALL_FINANCE.filter((permission) => canFinance(user, permission));
}
