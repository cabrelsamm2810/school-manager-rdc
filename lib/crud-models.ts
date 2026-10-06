import prisma from '@/lib/prisma';
import type { CrudModelConfig } from '@/lib/crud-factory';

/**
 * Configuration centrale de tous les modèles CRUD.
 * Chaque entrée définit le modèle Prisma, les champs, les rôles et la recherche.
 *
 * Règle de périmètre : `buildScopeWhere()` ajoute par défaut un filtre `province` et
 * `institution`. Un modèle Prisma qui ne possède pas ces champs DOIT donc déclarer
 * `provinceField: false` / `institutionField: false`, sinon Prisma rejette le `where`
 * (`PrismaClientValidationError` → 500) pour tout rôle non national.
 */

export const crudModels: Record<string, CrudModelConfig> = {
  enseignants: {
    delegate: prisma.enseignant,
    entityName: 'enseignant',
    entityNamePlural: 'enseignants',
    minRole: 'DIRECTION_ECOLE',
    searchFields: ['nom', 'matricule', 'ecole'],
    defaultSort: { field: 'nom', order: 'asc' },
    // L'enseignant n'a pas de province : aucun filtre de périmètre n'est applicable.
    provinceField: false,
    institutionField: false,
    include: { ecoleRattachee: { select: { id: true, nom: true } } },
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'matricule', type: 'string', required: true, unique: true },
      { name: 'grade', type: 'string' },
      { name: 'ecole', type: 'string' },
      { name: 'ecoleId', type: 'string', nullable: true },
      { name: 'specialite', type: 'string' },
      { name: 'telephone', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'statut', type: 'string' },
    ],
  },

  provinces: {
    delegate: prisma.province,
    entityName: 'province',
    entityNamePlural: 'provinces',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['nom', 'chefLieu'],
    defaultSort: { field: 'nom', order: 'asc' },
    provinceField: 'nom',
    institutionField: false,
    fields: [
      { name: 'nom', type: 'string', required: true, unique: true },
      { name: 'chefLieu', type: 'string' },
      { name: 'ecoles', type: 'number' },
      { name: 'eleves', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'provinces-educationnelles': {
    delegate: prisma.provinceEducationnelle,
    entityName: 'provinceEducationnelle',
    entityNamePlural: 'provincesEducationnelles',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['nom', 'provinceAdministrative', 'chefLieu'],
    defaultSort: { field: 'nom', order: 'asc' },
    provinceField: 'provinceAdministrative',
    institutionField: false,
    fields: [
      { name: 'nom', type: 'string', required: true, unique: true },
      { name: 'provinceAdministrative', type: 'string' },
      { name: 'chefLieu', type: 'string' },
      { name: 'sousDivisions', type: 'number' },
      { name: 'ecoles', type: 'number' },
      { name: 'eleves', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'sous-divisions': {
    delegate: prisma.sousDivisionEducationnelle,
    entityName: 'sousDivisionEducationnelle',
    entityNamePlural: 'sousDivisionsEducationnelles',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['nom', 'provinceEducationnelle', 'lieuImplantation'],
    defaultSort: { field: 'nom', order: 'asc' },
    provinceField: 'provinceAdministrative',
    institutionField: false,
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'provinceEducationnelle', type: 'string', required: true },
      { name: 'provinceAdministrative', type: 'string' },
      { name: 'lieuImplantation', type: 'string' },
      { name: 'ecoles', type: 'number' },
      { name: 'eleves', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'ec-erc': {
    delegate: prisma.ecErc,
    entityName: 'ecErc',
    entityNamePlural: 'ecErcs',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['nom', 'province'],
    defaultSort: { field: 'nom', order: 'asc' },
    provinceField: 'province',
    institutionField: 'institution',
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'type', type: 'string' },
      { name: 'institution', type: 'string' },
      { name: 'province', type: 'string' },
      { name: 'ecoles', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'coordination-nationale': {
    delegate: prisma.coordNationale,
    entityName: 'coordNationale',
    entityNamePlural: 'coordNationales',
    minRole: 'COORDINATION_NATIONALE',
    searchFields: ['province', 'coordonnateur'],
    defaultSort: { field: 'province', order: 'asc' },
    provinceField: 'province',
    institutionField: 'institution',
    fields: [
      { name: 'province', type: 'string', required: true },
      { name: 'institution', type: 'string' },
      { name: 'coordonnateur', type: 'string' },
      { name: 'ecoles', type: 'number' },
      { name: 'eleves', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'coordination-provinciale': {
    delegate: prisma.coordProvinciale,
    entityName: 'coordProvinciale',
    entityNamePlural: 'coordProvinciales',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['province'],
    defaultSort: { field: 'province', order: 'asc' },
    provinceField: 'province',
    institutionField: 'institution',
    fields: [
      { name: 'province', type: 'string', required: true },
      { name: 'institution', type: 'string' },
      { name: 'bureaux', type: 'number' },
      { name: 'agents', type: 'number' },
      { name: 'dossiers', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'coordination-sous-provinciale': {
    delegate: prisma.coordSousProvinciale,
    entityName: 'coordSousProvinciale',
    entityNamePlural: 'coordSousProvinciales',
    minRole: 'COORDINATION_SOUS_PROVINCIALE',
    searchFields: ['nom', 'province'],
    defaultSort: { field: 'nom', order: 'asc' },
    provinceField: 'province',
    sousProvincialeField: 'id',
    institutionField: 'institution',
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'province', type: 'string' },
      { name: 'institution', type: 'string' },
      { name: 'bureaux', type: 'number' },
      { name: 'agents', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  // Les modèles ci-dessous n'ont ni `province` ni `institution` : le filtre de
  // périmètre y est inapplicable et doit être désactivé explicitement.
  'bureaux-fonctions': {
    delegate: prisma.bureau,
    entityName: 'bureau',
    entityNamePlural: 'bureaux',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['bureau', 'fonction', 'titulaire', 'localisation'],
    defaultSort: { field: 'bureau', order: 'asc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'bureau', type: 'string', required: true },
      { name: 'fonction', type: 'string' },
      { name: 'titulaire', type: 'string' },
      { name: 'localisation', type: 'string' },
    ],
  },

  grades: {
    delegate: prisma.grade,
    entityName: 'grade',
    entityNamePlural: 'grades',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['grade', 'categorie'],
    defaultSort: { field: 'grade', order: 'asc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'grade', type: 'string', required: true },
      { name: 'categorie', type: 'string' },
      { name: 'effectif', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  dossiers: {
    delegate: prisma.dossier,
    entityName: 'dossier',
    entityNamePlural: 'dossiers',
    minRole: 'AGENT_PROVINCIAL',
    searchFields: ['reference', 'objet', 'demandeur'],
    defaultSort: { field: 'createdAt', order: 'desc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'reference', type: 'string', required: true, unique: true },
      { name: 'objet', type: 'string', required: true },
      { name: 'demandeur', type: 'string' },
      { name: 'statut', type: 'string' },
      { name: 'date', type: 'date' },
    ],
  },

  visites: {
    delegate: prisma.visite,
    entityName: 'visite',
    entityNamePlural: 'visites',
    minRole: 'AGENT_PROVINCIAL',
    searchFields: ['ecole', 'visiteur', 'objet'],
    defaultSort: { field: 'date', order: 'desc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'date', type: 'date' },
      { name: 'ecole', type: 'string', required: true },
      { name: 'visiteur', type: 'string' },
      { name: 'objet', type: 'string' },
      { name: 'statut', type: 'string' },
    ],
  },

  services: {
    delegate: prisma.serviceAdmin,
    entityName: 'serviceAdmin',
    entityNamePlural: 'serviceAdmins',
    minRole: 'AGENT_SOUS_PROVINCIAL',
    searchFields: ['service'],
    defaultSort: { field: 'service', order: 'asc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'service', type: 'string', required: true },
      { name: 'procedures', type: 'number' },
      { name: 'dossiers', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  notifications: {
    delegate: prisma.notification,
    entityName: 'notification',
    entityNamePlural: 'notifications',
    minRole: 'ELEVE',
    searchFields: ['titre', 'message', 'type'],
    defaultSort: { field: 'createdAt', order: 'desc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'titre', type: 'string', required: true },
      { name: 'message', type: 'string' },
      { name: 'type', type: 'string' },
      { name: 'lu', type: 'boolean' },
    ],
  },

  paiements: {
    delegate: prisma.paiement,
    entityName: 'paiement',
    entityNamePlural: 'paiements',
    minRole: 'DIRECTION_ECOLE',
    searchFields: ['reference', 'description'],
    defaultSort: { field: 'date', order: 'desc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'reference', type: 'string', required: true, unique: true },
      { name: 'description', type: 'string', required: true },
      { name: 'montant', type: 'string' },
      { name: 'date', type: 'date' },
      { name: 'statut', type: 'string' },
    ],
  },

  'classes-rdc': {
    delegate: prisma.classeRdc,
    entityName: 'classeRdc',
    entityNamePlural: 'classesRdc',
    minRole: 'DIRECTION_ECOLE',
    searchFields: ['nom', 'cycle', 'diplome'],
    defaultSort: { field: 'ordre', order: 'asc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'nom', type: 'string', required: true, unique: true },
      { name: 'cycle', type: 'string' },
      { name: 'ordre', type: 'number' },
      { name: 'diplome', type: 'string' },
      { name: 'statut', type: 'string' },
    ],
  },

  'matieres-rdc': {
    delegate: prisma.matiereRdc,
    entityName: 'matiereRdc',
    entityNamePlural: 'matieresRdc',
    minRole: 'DIRECTION_ECOLE',
    searchFields: ['nom', 'cycle', 'domaine'],
    defaultSort: { field: 'nom', order: 'asc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'cycle', type: 'string', required: true },
      { name: 'domaine', type: 'string' },
      { name: 'coefficient', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'options-rdc': {
    delegate: prisma.optionRdc,
    entityName: 'optionRdc',
    entityNamePlural: 'optionsRdc',
    minRole: 'DIRECTION_ECOLE',
    searchFields: ['nom', 'cycle', 'type', 'description'],
    defaultSort: { field: 'nom', order: 'asc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'cycle', type: 'string', required: true },
      { name: 'type', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'statut', type: 'string' },
    ],
  },

  notes: {
    delegate: prisma.note,
    entityName: 'note',
    entityNamePlural: 'notes',
    minRole: 'ENSEIGNANT',
    searchFields: ['eleve', 'classe'],
    defaultSort: { field: 'eleve', order: 'asc' },
    provinceField: false,
    institutionField: false,
    fields: [
      { name: 'eleve', type: 'string', required: true },
      { name: 'classe', type: 'string' },
      { name: 'devoir1', type: 'string' },
      { name: 'devoir2', type: 'string' },
      { name: 'examen', type: 'string' },
      { name: 'moyenne', type: 'string' },
      { name: 'mention', type: 'string' },
    ],
  },
};

export function getCrudModel(key: string): CrudModelConfig | undefined {
  return crudModels[key];
}
