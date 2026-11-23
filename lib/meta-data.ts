import { SOUS_DIVISIONS_RDC } from '@/lib/sous-divisions-rdc';
import { PROVINCE_NAMES, PROVINCES_EDUC_BY_ADMIN } from '@/lib/provinces-rdc';
import { INSTITUTIONS, STRUCTURE_CATEGORIES } from '@/lib/institutions';
import { OPTIONS_RDC } from '@/lib/curriculum-rdc';

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
  { value: 'PARENT', label: 'Parent / Tuteur' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
  { value: 'COMPTABLE', label: 'Comptable' },
  { value: 'SECRETAIRE', label: 'Secrétaire' },
  { value: 'DIRECTION_ECOLE', label: 'Chef d\u2019établissement' },
  { value: 'PROMOTEUR', label: 'Promoteur' },
  { value: 'AGENT_SOUS_PROVINCIAL', label: 'Agent de coordination sous-provinciale' },
  { value: 'COORDINATION_SOUS_PROVINCIALE', label: 'Coordination sous-provinciale' },
  { value: 'AGENT_PROVINCIAL', label: 'Agent provincial' },
  { value: 'COORDINATION_PROVINCIALE', label: 'Coordination provinciale' },
  { value: 'CHEF_ADMINISTRATION', label: 'Chef d\u2019administration' },
  { value: 'COORDINATION_NATIONALE', label: 'Coordination nationale' },
];

/* ── Données d'inscription ── */

/**
 * Chaîne de sélection de l'inscription publique :
 *   Type de structure → Institution → Établissement → Rôle → Bureau → Province → Permissions
 * Les institutions sont dérivées de `lib/institutions.ts` (source unique).
 */
export const registrationStructureTypes = STRUCTURE_CATEGORIES.map((c) => ({
  value: c.code,
  label: c.label,
  description: c.description,
}));

export const registrationInstitutionTypes = INSTITUTIONS.map((i) => ({
  value: i.code,
  label: i.label,
  categorie: i.categorie,
}));

/**
 * Rôles proposés à l'inscription publique : uniquement la communauté scolaire.
 * Les profils d'administration (coordination nationale/provinciale, chef
 * d'administration, agents) sont créés par l'administration et ne doivent jamais
 * apparaître dans le formulaire public.
 */
export const registrationRoleOptions: RoleOption[] = [
  { value: 'DIRECTION_ECOLE', label: 'Chef d\u2019établissement' },
  { value: 'PROMOTEUR', label: 'Promoteur' },
  { value: 'SECRETAIRE', label: 'Secrétaire' },
  { value: 'COMPTABLE', label: 'Comptable' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PARENT', label: 'Parent / Tuteur' },
];

export const PUBLIC_REGISTRATION_ROLES: string[] = registrationRoleOptions.map((r) => r.value);

/** Rôles ouverts à l'inscription publique pour une catégorie de structure. */
export const rolesByStructureCategorie: Record<string, string[]> = {
  PUBLIC: ['DIRECTION_ECOLE', 'SECRETAIRE', 'COMPTABLE', 'ENSEIGNANT', 'ELEVE', 'PARENT'],
  CONVENTIONNE: PUBLIC_REGISTRATION_ROLES,
  PRIVE_AGREE: PUBLIC_REGISTRATION_ROLES,
  PRIVE_INDEPENDANT: PUBLIC_REGISTRATION_ROLES,
};

/** Bureaux d'affectation propres à un établissement scolaire. */
export const schoolBureauxByRole: Record<string, string[]> = {
  DIRECTION_ECOLE: ['Direction', 'Direction des études', 'Discipline'],
  PROMOTEUR: ['Promotion', 'Administration générale'],
  SECRETAIRE: ['Secrétariat', 'Scolarité'],
  COMPTABLE: ['Comptabilité', 'Finances'],
  ENSEIGNANT: ['Enseignement'],
};

/** Sections (humanités) et options (technique) proposées dans le profil d'école. */
export const schoolSections: string[] = OPTIONS_RDC
  .filter((o) => o.type === 'Section')
  .map((o) => o.nom);

export const schoolOptions: string[] = OPTIONS_RDC
  .filter((o) => o.type === 'Option')
  .map((o) => o.nom);

/**
 * Niveaux d'enseignement du système éducatif congolais.
 * Liste exhaustive utilisée par le filtre de niveau et le profil de l'école.
 */
export const NIVEAUX_SCOLAIRES: string[] = [
  'Maternelle',
  'Primaire',
  'Secondaire',
  'Humanités',
  'Supérieur',
  'Professionnel',
  'Technique / Professionnel',
];

/** Sections sélectionnables dans la fenêtre « Configurer les sections et options ». */
export const PROFIL_ECOLE_SECTIONS: string[] = ['Maternelle', 'Primaire', 'Secondaire', 'Humanités'];

/**
 * Options des humanités organisées par l'établissement, regroupées par filière.
 * Source unique : `OPTIONS_RDC` (curriculum officiel RDC).
 */
export const humanitesOptions: { filiere: string; options: string[] }[] = [
  {
    filiere: 'Humanités générales',
    options: OPTIONS_RDC.filter((o) => o.type === 'Section').map((o) => o.nom),
  },
  {
    filiere: 'Humanités techniques',
    options: OPTIONS_RDC.filter((o) => o.type === 'Option').map((o) => o.nom),
  },
];

export const allRegistrationRoleOptions: RoleOption[] = [
  { value: 'COORDINATION_NATIONALE', label: 'Coordination nationale' },
  { value: 'COORDINATION_PROVINCIALE', label: 'Coordination provinciale' },
  { value: 'CHEF_ADMINISTRATION', label: 'Chef d\u2019administration' },
  { value: 'AGENT_PROVINCIAL', label: 'Agent provincial' },
  { value: 'COORDINATION_SOUS_PROVINCIALE', label: 'Coordination sous-provinciale' },
  { value: 'DIRECTION_ECOLE', label: 'Chef d\u2019établissement' },
  { value: 'PROMOTEUR', label: 'Promoteur' },
  { value: 'SECRETAIRE', label: 'Secrétaire' },
  { value: 'COMPTABLE', label: 'Comptable' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PARENT', label: 'Parent / Tuteur' },
];

/**
 * Les 26 provinces administratives de la RDC.
 * Source unique : `lib/provinces-rdc.ts` (mêmes libellés que la base de données —
 * ex. « Kongo Central », « Kasaï Central » — afin que les filtres en cascade et les
 * périmètres territoriaux comparent toujours des valeurs identiques).
 */
export const allProvinces: Province[] = PROVINCE_NAMES;

/** Ancienne liste pour compatibilité (sera remplacée progressivement). */
export const defaultProvinces: Province[] = allProvinces;

/**
 * Provinces éducationnelles liées à chaque province administrative
 * (dérivées de `PROVINCES_EDUCATIONNELLES`, comme la table `provinces_educationnelles`).
 */
export const educationProvincesByAdmin: Record<string, string[]> = Object.fromEntries(
  Object.entries(PROVINCES_EDUC_BY_ADMIN).map(([admin, list]) => [admin, list.map((pe) => pe.nom)]),
);

/** Bureaux d'affectation pour la structure provinciale EC-ERC. */
export const provincialBureaux = [
  'Bureau d\u2019administration',
  'Bureau de la formation',
  'Bureau de gestion',
  'Bureau de planification',
  'Bureau des écoles scolaires',
  'Bureau pédagogique',
  'Bureau des ressources humaines',
  'Bureau financier',
  'Bureau du contentieux',
];

/** Fonctions par rôle. */
export const fonctionsByRole: Record<string, string[]> = {
  COORDINATION_NATIONALE: ['Coordonnateur national', 'Coordonnateur national adjoint'],
  COORDINATION_PROVINCIALE: ['Coordinateur provincial', 'Coordinateur provincial adjoint', 'Chef d\u2019administration'],
  CHEF_ADMINISTRATION: ['Chef d\u2019administration', 'Chef de bureau', 'Agent administratif principal', 'Agent administratif', 'Secrétaire administratif'],
  AGENT_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  COORDINATION_SOUS_PROVINCIALE: ['Coordonnateur sous-provincial', 'Coordonnateur sous-provincial adjoint'],
  AGENT_SOUS_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  DIRECTION_ECOLE: ['Directeur', 'Directeur adjoint', 'Directeur des études'],
  PROMOTEUR: ['Promoteur', 'Promoteur adjoint'],
  SECRETAIRE: ['Secrétaire', 'Secrétaire adjoint'],
  COMPTABLE: ['Comptable', 'Comptable adjoint'],
  ENSEIGNANT: ['Professeur', 'Instituteur', 'Chef de travaux'],
  ELEVE: ['Élève'],
  PARENT: ['Parent', 'Tuteur'],
};

/** Grades par rôle. */
export const gradesByRole: Record<string, string[]> = {
  COORDINATION_NATIONALE: ['Coordonnateur principal', 'Coordonnateur', 'Coordonnateur adjoint'],
  COORDINATION_PROVINCIALE: ['Coordinateur principal', 'Coordinateur', 'Coordinateur adjoint', 'Chef d\u2019administration'],
  CHEF_ADMINISTRATION: ['Chef d\u2019administration', 'Principal', 'Adjoint', 'Agent principal', 'Agent'],
  AGENT_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  COORDINATION_SOUS_PROVINCIALE: ['Coordonnateur principal', 'Coordonnateur', 'Coordonnateur adjoint'],
  AGENT_SOUS_PROVINCIAL: ['Chef de bureau', 'Agent principal', 'Agent'],
  DIRECTION_ECOLE: ['Directeur', 'Directeur adjoint'],
  PROMOTEUR: ['Promoteur principal', 'Promoteur'],
  SECRETAIRE: ['Secrétaire principal', 'Secrétaire'],
  COMPTABLE: ['Comptable principal', 'Comptable'],
  ENSEIGNANT: ['Chef de travaux', 'Professeur', 'Instituteur principal', 'Instituteur'],
  ELEVE: [],
  PARENT: [],
};

/** Fonctions par bureau (pour la coordination provinciale). */
export const fonctionsByBureau: Record<string, string[]> = {
  'Bureau d\u2019administration': ['Chef d\u2019administration', 'Chef de bureau', 'Agent administratif principal', 'Agent administratif', 'Secrétaire administratif'],
  'Bureau de la formation': ['Coordinateur de formation', 'Formateur principal', 'Formateur', 'Animateur'],
  'Bureau de gestion': ['Gestionnaire principal', 'Gestionnaire', 'Comptable', 'Agent de gestion'],
  'Bureau de planification': ['Planificateur principal', 'Planificateur', 'Analyste', 'Agent de planification'],
  'Bureau des écoles scolaires': ['Superviseur des écoles', 'Agent de suivi', 'Inspecteur scolaire', 'Animateur scolaire'],
  'Bureau pédagogique': ['Conseiller pédagogique', 'Animateur pédagogique', 'Inspecteur pédagogique'],
  'Bureau des ressources humaines': ['Directeur RH', 'Agent RH', 'Chargé du personnel'],
  'Bureau financier': ['Directeur financier', 'Comptable principal', 'Agent financier'],
  'Bureau du contentieux': ['Juriste principal', 'Juriste', 'Agent juridique'],
};

/** Grades par bureau. */
export const gradesByBureau: Record<string, string[]> = {
  'Bureau d\u2019administration': ['Chef d\u2019administration', 'Principal', 'Adjoint', 'Agent principal', 'Agent'],
  'Bureau de la formation': ['Principal', 'Adjoint', 'Formateur principal', 'Formateur'],
  'Bureau de gestion': ['Principal', 'Adjoint', 'Gestionnaire principal', 'Gestionnaire'],
  'Bureau de planification': ['Principal', 'Adjoint', 'Planificateur principal', 'Planificateur'],
  'Bureau des écoles scolaires': ['Superviseur principal', 'Superviseur', 'Agent principal', 'Agent'],
  'Bureau pédagogique': ['Conseiller principal', 'Conseiller', 'Animateur'],
  'Bureau des ressources humaines': ['Directeur', 'Agent principal', 'Agent'],
  'Bureau financier': ['Directeur', 'Comptable principal', 'Agent'],
  'Bureau du contentieux': ['Juriste principal', 'Juriste', 'Agent'],
};

/** Rôles nécessitant l'étape d'affectation (province, sous-province, bureau). */
export const rolesNeedingAffectation = new Set([
  'COORDINATION_PROVINCIALE',
  'CHEF_ADMINISTRATION',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'PROMOTEUR',
  'SECRETAIRE',
  'COMPTABLE',
  'ENSEIGNANT',
  'ELEVE',
  'PARENT',
]);

/** Rôles nécessitant l'étape fonction et grade. */
export const rolesNeedingFonctionGrade = new Set([
  'COORDINATION_PROVINCIALE',
  'CHEF_ADMINISTRATION',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'PROMOTEUR',
  'SECRETAIRE',
  'COMPTABLE',
  'ENSEIGNANT',
]);

/** Rôles nécessitant le DINACOPE. */
export const rolesNeedingDinacope = new Set([
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'CHEF_ADMINISTRATION',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
]);

/** Rôles nécessitant la province éducationnelle. */
export const rolesNeedingEducationProvince = new Set([
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'PROMOTEUR',
  'SECRETAIRE',
  'COMPTABLE',
  'ENSEIGNANT',
  'ELEVE',
  'PARENT',
]);

/** Provinces éducationnelles par province administrative (issues des sous-divisions RDC). */
export const educationProvincesByAdminFromSousDivisions: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const sd of SOUS_DIVISIONS_RDC) {
    if (!map[sd.provinceAdministrative]) map[sd.provinceAdministrative] = [];
    if (!map[sd.provinceAdministrative].includes(sd.provinceEducationnelle)) {
      map[sd.provinceAdministrative].push(sd.provinceEducationnelle);
    }
  }
  return map;
})();

/** Sous-divisions par province éducationnelle. */
export const sousDivisionsByEducationProvince: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const sd of SOUS_DIVISIONS_RDC) {
    if (!map[sd.provinceEducationnelle]) map[sd.provinceEducationnelle] = [];
    map[sd.provinceEducationnelle].push(sd.nom);
  }
  return map;
})();

/** Types d'école pour le formulaire École. */
export const ecoleTypes = [
  'Maternelle',
  'Primaire',
  'Secondaire',
  'Collège',
  'Lycée',
  'Mixte',
];
