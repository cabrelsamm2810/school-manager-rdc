/**
 * Système de permissions — School Manager RDC.
 *
 * Principe : DENY BY DEFAULT.
 * Toute permission non explicitement accordée à un rôle est refusée.
 *
 * Architecture : ROLE + PERMISSION + PÉRIMÈTRE
 * - Le rôle détermine l'ensemble des permissions de l'utilisateur.
 * - Le périmètre (école, province, sous-provinciale) est vérifié séparément,
 *   côté serveur, par `lib/territory-filter.ts` et `lib/crud-models.ts`.
 */

/* ── Permissions granulaires ── */

export const PERM = {
  // Système (Super Admin uniquement)
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_SECURITY: 'system:security',
  SYSTEM_INTEGRATIONS: 'system:integrations',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_MAINTENANCE: 'system:maintenance',
  SYSTEM_PARAMS: 'system:params',
  ROLES_MANAGE: 'roles:manage',
  PERMISSIONS_MANAGE: 'permissions:manage',
  ADMINS_MANAGE: 'admins:manage',
  AUDIT_DELETE: 'audit:delete',

  // Administration School Manager RDC
  ADMIN_USERS: 'admin:users',
  ADMIN_USER_SEARCH: 'admin:user-search',
  ADMIN_USER_PROFILES: 'admin:user-profiles',
  ADMIN_USER_VALIDATE: 'admin:user-validate',
  ADMIN_USER_SUSPEND: 'admin:user-suspend',
  ADMIN_USER_REACTIVATE: 'admin:user-reactivate',
  ADMIN_ECOLES: 'admin:ecoles',
  ADMIN_REPORTS: 'admin:reports',
  ADMIN_SIGNALEMENTS: 'admin:signalements',
  ADMIN_ANNONCES: 'admin:annonces',
  ADMIN_SCHOOLCHAT: 'admin:schoolchat',
  ADMIN_STATS: 'admin:stats',
  ADMIN_ACTIVITY: 'admin:activity',
  ADMIN_EXPORT: 'admin:export',
  ADMIN_CONTENT: 'admin:content',
  ADMIN_DEMANDS: 'admin:demands',
  ADMIN_AUDIT_VIEW: 'admin:audit-view',

  // Coordination nationale
  NATIONAL_DASHBOARD: 'national:dashboard',
  NATIONAL_COMMUNICATIONS: 'national:communications',
  NATIONAL_DOSSIERS: 'national:dossiers',
  NATIONAL_STATS: 'national:stats',
  NATIONAL_REPORTS: 'national:reports',

  // Coordination provinciale
  PROVINCIAL_DASHBOARD: 'provincial:dashboard',
  PROVINCIAL_MANAGE: 'provincial:manage',
  PROVINCIAL_AGENTS: 'provincial:agents',
  PROVINCIAL_DOSSIERS: 'provincial:dossiers',
  PROVINCIAL_VALIDATE: 'provincial:validate',
  PROVINCIAL_TRANSFER: 'provincial:transfer',
  PROVINCIAL_STATS: 'provincial:stats',
  PROVINCIAL_REPORTS: 'provincial:reports',
  PROVINCIAL_COMMUNICATE: 'provincial:communicate',

  // Agent provincial
  AGENT_PROVINCIAL_VIEW: 'agent-provincial:view',
  AGENT_PROVINCIAL_DOSSIERS: 'agent-provincial:dossiers',
  AGENT_PROVINCIAL_OBSERVE: 'agent-provincial:observe',
  AGENT_PROVINCIAL_TRANSFER: 'agent-provincial:transfer',
  AGENT_PROVINCIAL_REPORTS: 'agent-provincial:reports',
  AGENT_PROVINCIAL_COMMUNICATE: 'agent-provincial:communicate',

  // Coordination sous-provinciale
  SOUS_PROVINCIAL_DASHBOARD: 'sous-provincial:dashboard',
  SOUS_PROVINCIAL_MANAGE: 'sous-provincial:manage',
  SOUS_PROVINCIAL_DOSSIERS: 'sous-provincial:dossiers',
  SOUS_PROVINCIAL_REPORTS: 'sous-provincial:reports',
  SOUS_PROVINCIAL_STATS: 'sous-provincial:stats',
  SOUS_PROVINCIAL_COMMUNICATE: 'sous-provincial:communicate',

  // Agent sous-provincial
  AGENT_SOUS_PROVINCIAL_VIEW: 'agent-sous-provincial:view',
  AGENT_SOUS_PROVINCIAL_DOSSIERS: 'agent-sous-provincial:dossiers',
  AGENT_SOUS_PROVINCIAL_OBSERVE: 'agent-sous-provincial:observe',
  AGENT_SOUS_PROVINCIAL_REPORTS: 'agent-sous-provincial:reports',
  AGENT_SOUS_PROVINCIAL_TRANSFER: 'agent-sous-provincial:transfer',

  // Promoteur
  PROMOTEUR_MANAGE: 'promoteur:manage',
  PROMOTEUR_STUDENTS: 'promoteur:students',
  PROMOTEUR_TEACHERS: 'promoteur:teachers',
  PROMOTEUR_USERS: 'promoteur:users',
  PROMOTEUR_STATS: 'promoteur:stats',
  PROMOTEUR_DOCUMENTS: 'promoteur:documents',

  // Chef d'établissement
  SCHOOL_STUDENTS: 'school:students',
  SCHOOL_CLASSES: 'school:classes',
  SCHOOL_TEACHERS: 'school:teachers',
  SCHOOL_INSCRIPTIONS: 'school:inscriptions',
  SCHOOL_PRESENCES: 'school:presences',
  SCHOOL_NOTES: 'school:notes',
  SCHOOL_BULLETINS: 'school:bulletins',
  SCHOOL_DOCUMENTS: 'school:documents',
  SCHOOL_STATS: 'school:stats',
  SCHOOL_DOSSIERS: 'school:dossiers',
  SCHOOL_TRANSFER: 'school:transfer',

  // Secrétaire
  SECRETARY_REGISTER: 'secretary:register',
  SECRETARY_DOSSIERS: 'secretary:dossiers',
  SECRETARY_DOCUMENTS: 'secretary:documents',
  SECRETARY_INSCRIPTIONS: 'secretary:inscriptions',
  SECRETARY_VISITES: 'secretary:visites',
  SECRETARY_TRANSFER: 'secretary:transfer',

  // Comptable
  COMPTABLE_PAYMENTS: 'comptable:payments',
  COMPTABLE_FEES: 'comptable:fees',
  COMPTABLE_RECEIPTS: 'comptable:receipts',
  COMPTABLE_TRANSACTIONS: 'comptable:transactions',
  COMPTABLE_REPORTS: 'comptable:reports',
  COMPTABLE_STATS: 'comptable:stats',

  // Enseignant
  TEACHER_CLASSES: 'teacher:classes',
  TEACHER_STUDENTS: 'teacher:students',
  TEACHER_SUBJECTS: 'teacher:subjects',
  TEACHER_NOTES: 'teacher:notes',
  TEACHER_PRESENCES: 'teacher:presences',
  TEACHER_SCHEDULE: 'teacher:schedule',

  // Élève
  STUDENT_PROFILE: 'student:profile',
  STUDENT_NOTES: 'student:notes',
  STUDENT_BULLETIN: 'student:bulletin',
  STUDENT_PRESENCES: 'student:presences',
  STUDENT_SCHEDULE: 'student:schedule',
  STUDENT_CARD: 'student:card',
  STUDENT_QR: 'student:qr',
  STUDENT_DOCUMENTS: 'student:documents',

  // Parent / Tuteur
  PARENT_PROFILE: 'parent:profile',
  PARENT_NOTES: 'parent:notes',
  PARENT_BULLETIN: 'parent:bulletin',
  PARENT_PRESENCES: 'parent:presences',
  PARENT_SCHEDULE: 'parent:schedule',
  PARENT_NOTIFICATIONS: 'parent:notifications',
  PARENT_DOCUMENTS: 'parent:documents',

  // Communication (transverse)
  CHAT_USE: 'chat:use',
  NOTIFICATIONS_VIEW: 'notifications:view',

  // Public
  PUBLIC_VIEW: 'public:view',
} as const;

export type Permission = (typeof PERM)[keyof typeof PERM];

/* ── Mapping ROLE → permissions ── */
/* DENY BY DEFAULT : seules les permissions listées sont accordées. */

const ALL_SYSTEM = [
  PERM.SYSTEM_CONFIG, PERM.SYSTEM_SECURITY, PERM.SYSTEM_INTEGRATIONS,
  PERM.SYSTEM_LOGS, PERM.SYSTEM_MAINTENANCE, PERM.SYSTEM_PARAMS,
  PERM.ROLES_MANAGE, PERM.PERMISSIONS_MANAGE, PERM.ADMINS_MANAGE,
  PERM.AUDIT_DELETE, PERM.ADMIN_AUDIT_VIEW,
];

const ALL_ADMIN_SMD = [
  PERM.ADMIN_USERS, PERM.ADMIN_USER_SEARCH, PERM.ADMIN_USER_PROFILES,
  PERM.ADMIN_USER_VALIDATE, PERM.ADMIN_USER_SUSPEND, PERM.ADMIN_USER_REACTIVATE,
  PERM.ADMIN_ECOLES, PERM.ADMIN_REPORTS, PERM.ADMIN_SIGNALEMENTS,
  PERM.ADMIN_ANNONCES, PERM.ADMIN_SCHOOLCHAT, PERM.ADMIN_STATS,
  PERM.ADMIN_ACTIVITY, PERM.ADMIN_EXPORT, PERM.ADMIN_CONTENT,
  PERM.ADMIN_DEMANDS, PERM.ADMIN_AUDIT_VIEW,
];

const ALL_NATIONAL = [
  PERM.NATIONAL_DASHBOARD, PERM.NATIONAL_COMMUNICATIONS, PERM.NATIONAL_DOSSIERS,
  PERM.NATIONAL_STATS, PERM.NATIONAL_REPORTS,
];

const ALL_PROVINCIAL = [
  PERM.PROVINCIAL_DASHBOARD, PERM.PROVINCIAL_MANAGE, PERM.PROVINCIAL_AGENTS,
  PERM.PROVINCIAL_DOSSIERS, PERM.PROVINCIAL_VALIDATE, PERM.PROVINCIAL_TRANSFER,
  PERM.PROVINCIAL_STATS, PERM.PROVINCIAL_REPORTS, PERM.PROVINCIAL_COMMUNICATE,
];

const ALL_AGENT_PROVINCIAL = [
  PERM.AGENT_PROVINCIAL_VIEW, PERM.AGENT_PROVINCIAL_DOSSIERS,
  PERM.AGENT_PROVINCIAL_OBSERVE, PERM.AGENT_PROVINCIAL_TRANSFER,
  PERM.AGENT_PROVINCIAL_REPORTS, PERM.AGENT_PROVINCIAL_COMMUNICATE,
];

const ALL_SOUS_PROVINCIAL = [
  PERM.SOUS_PROVINCIAL_DASHBOARD, PERM.SOUS_PROVINCIAL_MANAGE,
  PERM.SOUS_PROVINCIAL_DOSSIERS, PERM.SOUS_PROVINCIAL_REPORTS,
  PERM.SOUS_PROVINCIAL_STATS, PERM.SOUS_PROVINCIAL_COMMUNICATE,
];

const ALL_AGENT_SOUS_PROVINCIAL = [
  PERM.AGENT_SOUS_PROVINCIAL_VIEW, PERM.AGENT_SOUS_PROVINCIAL_DOSSIERS,
  PERM.AGENT_SOUS_PROVINCIAL_OBSERVE, PERM.AGENT_SOUS_PROVINCIAL_REPORTS,
  PERM.AGENT_SOUS_PROVINCIAL_TRANSFER,
];

const ALL_PROMOTEUR = [
  PERM.PROMOTEUR_MANAGE, PERM.PROMOTEUR_STUDENTS, PERM.PROMOTEUR_TEACHERS,
  PERM.PROMOTEUR_USERS, PERM.PROMOTEUR_STATS, PERM.PROMOTEUR_DOCUMENTS,
  PERM.CHAT_USE, PERM.NOTIFICATIONS_VIEW,
];

const ALL_DIRECTION = [
  PERM.SCHOOL_STUDENTS, PERM.SCHOOL_CLASSES, PERM.SCHOOL_TEACHERS,
  PERM.SCHOOL_INSCRIPTIONS, PERM.SCHOOL_PRESENCES, PERM.SCHOOL_NOTES,
  PERM.SCHOOL_BULLETINS, PERM.SCHOOL_DOCUMENTS, PERM.SCHOOL_STATS,
  PERM.SCHOOL_DOSSIERS, PERM.SCHOOL_TRANSFER,
  PERM.CHAT_USE, PERM.NOTIFICATIONS_VIEW,
];

const ALL_SECRETARY = [
  PERM.SECRETARY_REGISTER, PERM.SECRETARY_DOSSIERS, PERM.SECRETARY_DOCUMENTS,
  PERM.SECRETARY_INSCRIPTIONS, PERM.SECRETARY_VISITES, PERM.SECRETARY_TRANSFER,
  PERM.CHAT_USE, PERM.NOTIFICATIONS_VIEW,
];

const ALL_COMPTABLE = [
  PERM.COMPTABLE_PAYMENTS, PERM.COMPTABLE_FEES, PERM.COMPTABLE_RECEIPTS,
  PERM.COMPTABLE_TRANSACTIONS, PERM.COMPTABLE_REPORTS, PERM.COMPTABLE_STATS,
  PERM.CHAT_USE, PERM.NOTIFICATIONS_VIEW,
];

const ALL_TEACHER = [
  PERM.TEACHER_CLASSES, PERM.TEACHER_STUDENTS, PERM.TEACHER_SUBJECTS,
  PERM.TEACHER_NOTES, PERM.TEACHER_PRESENCES, PERM.TEACHER_SCHEDULE,
  PERM.CHAT_USE, PERM.NOTIFICATIONS_VIEW,
];

const ALL_STUDENT = [
  PERM.STUDENT_PROFILE, PERM.STUDENT_NOTES, PERM.STUDENT_BULLETIN,
  PERM.STUDENT_PRESENCES, PERM.STUDENT_SCHEDULE, PERM.STUDENT_CARD,
  PERM.STUDENT_QR, PERM.STUDENT_DOCUMENTS,
  PERM.CHAT_USE,
];

const ALL_PARENT = [
  PERM.PARENT_PROFILE, PERM.PARENT_NOTES, PERM.PARENT_BULLETIN,
  PERM.PARENT_PRESENCES, PERM.PARENT_SCHEDULE, PERM.PARENT_NOTIFICATIONS,
  PERM.PARENT_DOCUMENTS,
  PERM.CHAT_USE,
];

const ALL_VISITEUR = [
  PERM.PUBLIC_VIEW,
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [...ALL_SYSTEM, ...ALL_ADMIN_SMD, ...ALL_NATIONAL, ...ALL_PROVINCIAL, ...ALL_SOUS_PROVINCIAL, ...ALL_DIRECTION, PERM.CHAT_USE, PERM.NOTIFICATIONS_VIEW],
  ADMIN_SCHOOL_MANAGER_RDC: [...ALL_ADMIN_SMD],
  COORDINATION_NATIONALE: [...ALL_NATIONAL],
  COORDINATION_PROVINCIALE: [...ALL_PROVINCIAL],
  AGENT_PROVINCIAL: [...ALL_AGENT_PROVINCIAL],
  COORDINATION_SOUS_PROVINCIALE: [...ALL_SOUS_PROVINCIAL],
  AGENT_SOUS_PROVINCIAL: [...ALL_AGENT_SOUS_PROVINCIAL],
  PROMOTEUR: [...ALL_PROMOTEUR],
  DIRECTION_ECOLE: [...ALL_DIRECTION],
  SECRETAIRE: [...ALL_SECRETARY],
  COMPTABLE: [...ALL_COMPTABLE],
  ENSEIGNANT: [...ALL_TEACHER],
  PARENT: [...ALL_PARENT],
  ELEVE: [...ALL_STUDENT],
  VISITEUR: [...ALL_VISITEUR],
};

/**
 * Vérifie si un rôle possède une permission.
 * DENY BY DEFAULT : un rôle inconnu n'a aucune permission.
 */
export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}

/**
 * Vérifie si un rôle possède au moins une des permissions.
 */
export function canAny(role: string | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => can(role, p));
}

/**
 * Vérifie si un rôle possède toutes les permissions.
 */
export function canAll(role: string | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((p) => can(role, p));
}
