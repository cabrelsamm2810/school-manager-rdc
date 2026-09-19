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

export function isSuperAdmin(role: string): boolean {
  return role.toLowerCase() === 'super administrator' || role.toLowerCase() === 'super_admin';
}

export function canAccessPrivateSchoolChat(role: string): boolean {
  if (isSuperAdmin(role)) return false;
  const allowedRoles = ['teacher', 'school director', 'parent', 'student'];
  return allowedRoles.includes(role.toLowerCase());
}

export function validateRoleAssignment(role: string): boolean {
  return Object.values(roleHierarchy)
    .flat()
    .includes(role.toLowerCase());
}
