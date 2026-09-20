export type InstitutionType = {
  value: string;
  label: string;
};

export type RoleOption = {
  value: string;
  label: string;
};

export type Province = string;

export const defaultInstitutionTypes: InstitutionType[] = [
  { value: 'ECOLE', label: 'École' },
  { value: 'COLLEGE', label: 'Collège' },
  { value: 'LYCEE', label: 'Lycée' },
  { value: 'UNIVERSITE', label: 'Université' },
  { value: 'MINISTERE', label: 'Ministère / Administration' },
  { value: 'AUTRE', label: 'Autre' }
];

export const defaultRoleOptions: RoleOption[] = [
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
  { value: 'DIRECTION_ECOLE', label: 'Direction d’école' },
  { value: 'AGENT_SOUS_PROVINCIAL', label: 'Agent sous provincial' },
  { value: 'COORDINATION_SOUS_PROVINCIALE', label: 'Coordination sous provinciale' },
  { value: 'AGENT_PROVINCIAL', label: 'Agent provincial' },
  { value: 'COORDINATION_PROVINCIALE', label: 'Coordination provinciale' },
  { value: 'COORDINATION_NATIONALE', label: 'Coordination nationale' },
  { value: 'SUPER_ADMIN', label: 'Super administrateur' }
];

export const defaultProvinces: Province[] = [
  'Kinshasa',
  'Kongo-Central',
  'Kasaï',
  'Kasaï-Central',
  'Kasaï-Oriental',
  'Lualaba',
  'Haut-Katanga',
  'Haut-Lomami',
  'Maniema',
  'Tshopo',
  'Ituri',
  'Nord-Kivu',
  'Sud-Kivu',
  'Bas-Uele',
  'Haut-Uele',
  'Tanganyika',
  'Nord-Ubangi',
  'Sud-Ubangi',
  'Mongala',
  'Equateur',
  'Province orientale'
];
