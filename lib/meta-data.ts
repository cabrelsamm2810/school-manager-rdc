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
  { value: 'DIRECTION_ECOLE', label: 'Direction d\u2019école' },
  { value: 'AGENT_SOUS_PROVINCIAL', label: 'Agent sous provincial' },
  { value: 'COORDINATION_SOUS_PROVINCIALE', label: 'Coordination sous provinciale' },
  { value: 'AGENT_PROVINCIAL', label: 'Agent provincial' },
  { value: 'COORDINATION_PROVINCIALE', label: 'Coordination provinciale' },
  { value: 'COORDINATION_NATIONALE', label: 'Coordination nationale' },
  { value: 'SUPER_ADMIN', label: 'Super administrateur' }
];

/* ── Données d'inscription ── */

export const registrationInstitutionTypes = [
  { value: 'EC-ERC', label: 'EC-ERC — Écoles Conventionnées des Églises du Réveil du Congo' },
  { value: 'INDEPENDANTE', label: 'Indépendante' },
  { value: 'CATHOLIQUE', label: 'Catholique' },
  { value: 'PUBLIQUE', label: 'Publique' },
  { value: 'ISLAMIQUE', label: 'Islamique' },
];

export const ecErcRoleOptions: RoleOption[] = [
  { value: 'COORDINATION_NATIONALE', label: 'Coordination nationale' },
  { value: 'COORDINATION_PROVINCIALE', label: 'Coordination provinciale' },
  { value: 'AGENT_PROVINCIAL', label: 'Agent provincial' },
  { value: 'COORDINATION_SOUS_PROVINCIALE', label: 'Coordination sous provinciale' },
  { value: 'AGENT_SOUS_PROVINCIAL', label: 'Agent sous provincial' },
];

export const nonEcErcRoleOptions: RoleOption[] = [
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
  { value: 'DIRECTION_ECOLE', label: 'Direction d\u2019école' },
];

/** Les 26 provinces administratives de la RDC. */
export const allProvinces: Province[] = [
  'Kinshasa',
  'Kongo-Central',
  'Kwango',
  'Kwilu',
  'Mai-Ndombe',
  'Équateur',
  'Mongala',
  'Sud-Ubangi',
  'Nord-Ubangi',
  'Bas-Uele',
  'Haut-Uele',
  'Ituri',
  'Tshopo',
  'Tshuapa',
  'Kasaï',
  'Kasaï-Central',
  'Kasaï-Oriental',
  'Lomami',
  'Sankuru',
  'Maniema',
  'Sud-Kivu',
  'Nord-Kivu',
  'Haut-Lomami',
  'Tanganyika',
  'Haut-Katanga',
  'Lualaba',
];

/** Ancienne liste pour compatibilité (sera remplacée progressivement). */
export const defaultProvinces: Province[] = allProvinces;

/** Provinces éducationnelles liées à chaque province administrative. */
export const educationProvincesByAdmin: Record<string, string[]> = {
  'Kinshasa': ['Kinshasa 1', 'Kinshasa 2'],
  'Kongo-Central': ['Kongo-Central'],
  'Kwango': ['Kwango'],
  'Kwilu': ['Kwilu'],
  'Mai-Ndombe': ['Mai-Ndombe'],
  'Équateur': ['Équateur'],
  'Mongala': ['Mongala'],
  'Sud-Ubangi': ['Sud-Ubangi'],
  'Nord-Ubangi': ['Nord-Ubangi'],
  'Bas-Uele': ['Bas-Uele'],
  'Haut-Uele': ['Haut-Uele'],
  'Ituri': ['Ituri'],
  'Tshopo': ['Tshopo'],
  'Tshuapa': ['Tshuapa'],
  'Kasaï': ['Kasaï'],
  'Kasaï-Central': ['Kasaï-Central'],
  'Kasaï-Oriental': ['Kasaï-Oriental 1', 'Kasaï-Oriental 2'],
  'Lomami': ['Lomami'],
  'Sankuru': ['Sankuru'],
  'Maniema': ['Maniema'],
  'Sud-Kivu': ['Sud-Kivu'],
  'Nord-Kivu': ['Nord-Kivu'],
  'Haut-Lomami': ['Haut-Lomami'],
  'Tanganyika': ['Tanganyika'],
  'Haut-Katanga': ['Haut-Katanga 1', 'Haut-Katanga 2'],
  'Lualaba': ['Lualaba'],
};

/** Bureaux d'affectation pour la structure provinciale EC-ERC. */
export const provincialBureaux = [
  'Bureau d\u2019affectation',
  'Bureau d\u2019administration',
  'Bureau de la formation',
  'Bureau pédagogique',
  'Bureau des ressources humaines',
  'Bureau financier',
  'Bureau de la planification',
  'Bureau du contentieux',
];

/** Fonctions par rôle. */
export const fonctionsByRole: Record<string, string[]> = {
  COORDINATION_NATIONALE: ['Coordonnateur national', 'Coordonnateur national adjoint'],
  COORDINATION_PROVINCIALE: ['Coordonnateur provincial', 'Coordonnateur provincial adjoint'],
  AGENT_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  COORDINATION_SOUS_PROVINCIALE: ['Coordonnateur sous-provincial', 'Coordonnateur sous-provincial adjoint'],
  AGENT_SOUS_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  DIRECTION_ECOLE: ['Directeur', 'Directeur adjoint', 'Directeur des études'],
  ENSEIGNANT: ['Professeur', 'Instituteur', 'Chef de travaux'],
  ELEVE: ['Élève'],
  PARENT: ['Parent', 'Tuteur'],
};

/** Grades par rôle. */
export const gradesByRole: Record<string, string[]> = {
  COORDINATION_NATIONALE: ['Coordonnateur principal', 'Coordonnateur', 'Coordonnateur adjoint'],
  COORDINATION_PROVINCIALE: ['Coordonnateur principal', 'Coordonnateur', 'Coordonnateur adjoint'],
  AGENT_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  COORDINATION_SOUS_PROVINCIALE: ['Coordonnateur principal', 'Coordonnateur', 'Coordonnateur adjoint'],
  AGENT_SOUS_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  DIRECTION_ECOLE: ['Directeur', 'Directeur adjoint'],
  ENSEIGNANT: ['Chef de travaux', 'Professeur', 'Instituteur principal', 'Instituteur'],
  ELEVE: [],
  PARENT: [],
};

/** Rôles nécessitant l'étape d'affectation (province, sous-province, bureau). */
export const rolesNeedingAffectation = new Set([
  'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'ENSEIGNANT',
  'ELEVE',
  'PARENT',
]);

/** Rôles nécessitant l'étape fonction et grade. */
export const rolesNeedingFonctionGrade = new Set([
  'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'ENSEIGNANT',
]);

/** Rôles nécessitant le DINACOPE. */
export const rolesNeedingDinacope = new Set([
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
]);

/** Rôles nécessitant la province éducationnelle. */
export const rolesNeedingEducationProvince = new Set([
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'ENSEIGNANT',
  'ELEVE',
  'PARENT',
]);
