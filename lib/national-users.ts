/**
 * Comptes que la Coordination nationale EC-ERC peut créer et administrer.
 * Les rôles système (Super Admin, Admin SMD) en sont exclus.
 */
export const NATIONAL_MANAGED_ROLES = [
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL'
] as const;

export type NationalManagedRole = (typeof NATIONAL_MANAGED_ROLES)[number];

export const NATIONAL_MANAGED_ROLE_LABELS: Record<NationalManagedRole, string> = {
  COORDINATION_NATIONALE: 'Coordination nationale',
  COORDINATION_PROVINCIALE: 'Coordination provinciale',
  AGENT_PROVINCIAL: 'Agent provincial',
  COORDINATION_SOUS_PROVINCIALE: 'Coordination sous-provinciale',
  AGENT_SOUS_PROVINCIAL: 'Agent sous-provincial'
};

export function isNationalManagedRole(role: string): role is NationalManagedRole {
  return (NATIONAL_MANAGED_ROLES as readonly string[]).includes(role);
}
