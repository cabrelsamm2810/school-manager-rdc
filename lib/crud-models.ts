import prisma from '@/lib/prisma';
import type { CrudModelConfig } from '@/lib/crud-factory';

/**
 * Configuration centrale de tous les modèles CRUD.
 * Chaque entrée définit le modèle Prisma, les champs, les rôles et la recherche.
 */

export const crudModels: Record<string, CrudModelConfig> = {
  enseignants: {
    delegate: prisma.enseignant,
    entityName: 'enseignant',
    entityNamePlural: 'enseignants',
    minRole: 'DIRECTION_ECOLE',
    searchFields: ['nom', 'matricule', 'etablissement'],
    defaultSort: { field: 'nom', order: 'asc' },
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'matricule', type: 'string', required: true, unique: true },
      { name: 'grade', type: 'string' },
      { name: 'etablissement', type: 'string' },
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
    fields: [
      { name: 'nom', type: 'string', required: true, unique: true },
      { name: 'chefLieu', type: 'string' },
      { name: 'etablissements', type: 'number' },
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
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'type', type: 'string' },
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
    fields: [
      { name: 'province', type: 'string', required: true },
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
    fields: [
      { name: 'province', type: 'string', required: true },
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
    fields: [
      { name: 'nom', type: 'string', required: true },
      { name: 'province', type: 'string' },
      { name: 'bureaux', type: 'number' },
      { name: 'agents', type: 'number' },
      { name: 'statut', type: 'string' },
    ],
  },

  'bureaux-fonctions': {
    delegate: prisma.bureau,
    entityName: 'bureau',
    entityNamePlural: 'bureaux',
    minRole: 'COORDINATION_PROVINCIALE',
    searchFields: ['bureau', 'fonction', 'titulaire', 'localisation'],
    defaultSort: { field: 'bureau', order: 'asc' },
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
    searchFields: ['etablissement', 'visiteur', 'objet'],
    defaultSort: { field: 'date', order: 'desc' },
    fields: [
      { name: 'date', type: 'date' },
      { name: 'etablissement', type: 'string', required: true },
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
    fields: [
      { name: 'reference', type: 'string', required: true, unique: true },
      { name: 'description', type: 'string', required: true },
      { name: 'montant', type: 'string' },
      { name: 'date', type: 'date' },
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
