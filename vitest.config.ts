export const roleHierarchy = {
  SUPER_ADMIN: ['super-admin'],
  NATIONAL_COORDINATION: ['national-coordination'],
  PROVINCIAL_COORDINATION: ['provincial-coordination'],
  PROVINCIAL_AGENT: ['provincial-agent'],
  SUB_PROVINCIAL_COORDINATION: ['sub-provincial-coordination'],
  SUB_PROVINCIAL_AGENT: ['sub-provincial-agent'],
  SCHOOL_DIRECTOR: ['school-director'],
  TEACHER: ['teacher'],
  PARENT: ['parent'],
  STUDENT: ['student']
} as const;

export type RoleCode = keyof typeof roleHierarchy;

export const systemRoles: Record<RoleCode, string> = {
  SUPER_ADMIN: 'Super administrateur',
  NATIONAL_COORDINATION: 'Coordination nationale',
  PROVINCIAL_COORDINATION: 'Coordination provinciale',
  PROVINCIAL_AGENT: 'Agent provincial',
  SUB_PROVINCIAL_COORDINATION: 'Coordination sous-provinciale',
  SUB_PROVINCIAL_AGENT: 'Agent sous-provincial',
  SCHOOL_DIRECTOR: 'Direction d\'école',
  TEACHER: 'Enseignant',
  PARENT: 'Parent',
  STUDENT: 'Élève'
};

export function isSuperAdmin(role: string): boolean {
  return role.toLowerCase() === 'super administrator' || role.toLowerCase() === 'super_admin';
}

export function canAccessPrivateSchoolChat(role: string): boolean {
  if (isSuperAdmin(role)) return false;
  const allowedRoles = ['teacher', 'school director', 'parent', 'student'];
  return allowedRoles.includes(role.toLowerCase());
}

export function validateRoleAssignment(role: string): boolean {
  const lowered = role.toLowerCase();
  return Object.values(roleHierarchy)
    .flat()
    .includes(lowered);
}

export function ensureRoleIsSafe(role: string): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return validateRoleAssignment(role);
}
