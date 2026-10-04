import type { CrudConfig } from '@/components/CrudManager';
import { statutBadge } from '@/lib/demo-data';

/**
 * Configurations frontend pour le CrudManager de chaque module.
 */

export const crudConfigs: Record<string, CrudConfig> = {
  enseignants: {
    apiPath: '/api/enseignants',
    entityName: 'enseignant',
    entityNamePlural: 'enseignants',
    icon: 'teacher',
    searchFields: ['nom', 'matricule', 'etablissement'],
    fields: [
      { name: 'nom', label: 'Nom complet', type: 'text', required: true },
      { name: 'matricule', label: 'Matricule', type: 'text', required: true, half: true },
      { name: 'grade', label: 'Grade', type: 'text', half: true },
      { name: 'etablissement', label: 'Établissement', type: 'text', half: true },
      { name: 'specialite', label: 'Spécialité', type: 'text', half: true },
      { name: 'telephone', label: 'Téléphone', type: 'text', half: true },
      { name: 'email', label: 'Email', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Congé', label: 'En congé' },
        { value: 'Inactif', label: 'Inactif' },
      ] },
    ],
    columns: [
      { key: 'nom', label: 'Nom', render: (e: any) => <span className="font-medium text-slate-900">{e.nom}</span> },
      { key: 'matricule', label: 'Matricule' },
      { key: 'grade', label: 'Grade' },
      { key: 'etablissement', label: 'Établissement' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'etablissement', label: 'Tous les établissements' },
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Congé', label: 'En congé' },
        { value: 'Inactif', label: 'Inactif' },
      ] },
    ],
    statCards: [
      { label: 'Enseignants', value: (items: any[]) => String(items.length), hint: 'Total recensés' },
      { label: 'Actifs', value: (items: any[]) => String(items.filter((e) => e.statut === 'Actif').length) },
      { label: 'En congé', value: (items: any[]) => String(items.filter((e) => e.statut === 'Congé').length) },
      { label: 'Grades distincts', value: (items: any[]) => String(new Set(items.map((e) => e.grade)).size) },
    ],
  },

  provinces: {
    apiPath: '/api/provinces',
    entityName: 'province',
    entityNamePlural: 'provinces',
    icon: 'globe',
    searchFields: ['nom', 'chefLieu'],
    fields: [
      { name: 'nom', label: 'Nom de la province', type: 'text', required: true },
      { name: 'chefLieu', label: 'Chef-lieu', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En setup', label: 'En setup' },
      ] },
      { name: 'etablissements', label: 'Nb établissements', type: 'number', half: true, default: 0 },
      { name: 'eleves', label: "Nb élèves", type: 'number', half: true, default: 0 },
    ],
    columns: [
      { key: 'nom', label: 'Province', render: (e: any) => <span className="font-medium text-slate-900">{e.nom}</span> },
      { key: 'chefLieu', label: 'Chef-lieu' },
      { key: 'etablissements', label: 'Établissements' },
      { key: 'eleves', label: 'Élèves' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En setup', label: 'En setup' },
      ] },
    ],
    statCards: [
      { label: 'Provinces', value: (items: any[]) => String(items.length), hint: 'Total' },
      { label: 'Actives', value: (items: any[]) => String(items.filter((e) => e.statut === 'Actif').length) },
      { label: 'En setup', value: (items: any[]) => String(items.filter((e) => e.statut === 'En setup').length) },
      { label: 'Élèves total', value: (items: any[]) => items.reduce((s, e) => s + (e.eleves || 0), 0).toLocaleString('fr-FR') },
    ],
  },

  'ec-erc': {
    apiPath: '/api/ec-erc',
    entityName: 'ecErc',
    entityNamePlural: 'ecErcs',
    icon: 'organization',
    searchFields: ['nom', 'province'],
    fields: [
      { name: 'nom', label: 'Nom', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', half: true, options: [
        { value: 'Entité EC', label: 'Entité EC' },
        { value: 'Entité ERC', label: 'Entité ERC' },
      ] },
      { name: 'province', label: 'Province', type: 'text', half: true },
      { name: 'ecoles', label: "Nb écoles", type: 'number', half: true, default: 0 },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En setup', label: 'En setup' },
      ] },
    ],
    columns: [
      { key: 'nom', label: 'Nom', render: (e: any) => <span className="font-medium text-slate-900">{e.nom}</span> },
      { key: 'type', label: 'Type' },
      { key: 'province', label: 'Province' },
      { key: 'ecoles', label: 'Écoles' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'type', label: 'Tous les types', options: [
        { value: 'Entité EC', label: 'Entité EC' },
        { value: 'Entité ERC', label: 'Entité ERC' },
      ] },
      { name: 'province', label: 'Toutes les provinces' },
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En setup', label: 'En setup' },
      ] },
    ],
    statCards: [
      { label: 'Entités', value: (items: any[]) => String(items.length) },
      { label: 'EC', value: (items: any[]) => String(items.filter((e) => e.type === 'Entité EC').length) },
      { label: 'ERC', value: (items: any[]) => String(items.filter((e) => e.type === 'Entité ERC').length) },
      { label: 'Actives', value: (items: any[]) => String(items.filter((e) => e.statut === 'Actif').length) },
    ],
  },

  'coordination-nationale': {
    apiPath: '/api/coordination-nationale',
    entityName: 'coordNationale',
    entityNamePlural: 'coordNationales',
    icon: 'flag',
    searchFields: ['province', 'coordonnateur'],
    fields: [
      { name: 'province', label: 'Province', type: 'text', required: true },
      { name: 'coordonnateur', label: 'Coordonnateur', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Vacant', label: 'Vacant' },
      ] },
      { name: 'ecoles', label: "Nb écoles", type: 'number', half: true, default: 0 },
      { name: 'eleves', label: "Nb élèves", type: 'number', half: true, default: 0 },
    ],
    columns: [
      { key: 'province', label: 'Province', render: (e: any) => <span className="font-medium text-slate-900">{e.province}</span> },
      { key: 'coordonnateur', label: 'Coordonnateur' },
      { key: 'ecoles', label: 'Écoles' },
      { key: 'eleves', label: 'Élèves' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Vacant', label: 'Vacant' },
      ] },
    ],
    statCards: [
      { label: 'Provinces', value: (items: any[]) => String(items.length) },
      { label: 'Actives', value: (items: any[]) => String(items.filter((e) => e.statut === 'Actif').length) },
      { label: 'Vacantes', value: (items: any[]) => String(items.filter((e) => e.statut === 'Vacant').length) },
      { label: 'Élèves total', value: (items: any[]) => items.reduce((s, e) => s + (e.eleves || 0), 0).toLocaleString('fr-FR') },
    ],
  },

  'coordination-provinciale': {
    apiPath: '/api/coordination-provinciale',
    entityName: 'coordProvinciale',
    entityNamePlural: 'coordProvinciales',
    icon: 'region',
    searchFields: ['province'],
    fields: [
      { name: 'province', label: 'Province', type: 'text', required: true },
      { name: 'bureaux', label: 'Nb bureaux', type: 'number', half: true, default: 0 },
      { name: 'agents', label: "Nb agents", type: 'number', half: true, default: 0 },
      { name: 'dossiers', label: 'Nb dossiers', type: 'number', half: true, default: 0 },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Inactif', label: 'Inactif' },
      ] },
    ],
    columns: [
      { key: 'province', label: 'Province', render: (e: any) => <span className="font-medium text-slate-900">{e.province}</span> },
      { key: 'bureaux', label: 'Bureaux' },
      { key: 'agents', label: 'Agents' },
      { key: 'dossiers', label: 'Dossiers' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Inactif', label: 'Inactif' },
      ] },
    ],
    statCards: [
      { label: 'Provinces', value: (items: any[]) => String(items.length) },
      { label: 'Bureaux', value: (items: any[]) => String(items.reduce((s, e) => s + (e.bureaux || 0), 0)) },
      { label: 'Agents', value: (items: any[]) => String(items.reduce((s, e) => s + (e.agents || 0), 0)) },
      { label: 'Dossiers', value: (items: any[]) => String(items.reduce((s, e) => s + (e.dossiers || 0), 0)) },
    ],
  },

  'coordination-sous-provinciale': {
    apiPath: '/api/coordination-sous-provinciale',
    entityName: 'coordSousProvinciale',
    entityNamePlural: 'coordSousProvinciales',
    icon: 'district',
    searchFields: ['nom', 'province'],
    fields: [
      { name: 'nom', label: 'Nom', type: 'text', required: true },
      { name: 'province', label: 'Province', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En setup', label: 'En setup' },
      ] },
      { name: 'bureaux', label: 'Nb bureaux', type: 'number', half: true, default: 0 },
      { name: 'agents', label: "Nb agents", type: 'number', half: true, default: 0 },
    ],
    columns: [
      { key: 'nom', label: 'Nom', render: (e: any) => <span className="font-medium text-slate-900">{e.nom}</span> },
      { key: 'province', label: 'Province' },
      { key: 'bureaux', label: 'Bureaux' },
      { key: 'agents', label: 'Agents' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'province', label: 'Toutes les provinces' },
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En setup', label: 'En setup' },
      ] },
    ],
    statCards: [
      { label: 'Sous-divisions', value: (items: any[]) => String(items.length) },
      { label: 'Actives', value: (items: any[]) => String(items.filter((e) => e.statut === 'Actif').length) },
      { label: 'En setup', value: (items: any[]) => String(items.filter((e) => e.statut === 'En setup').length) },
      { label: 'Agents', value: (items: any[]) => String(items.reduce((s, e) => s + (e.agents || 0), 0)) },
    ],
  },

  'bureaux-fonctions': {
    apiPath: '/api/bureaux-fonctions',
    entityName: 'bureau',
    entityNamePlural: 'bureaux',
    icon: 'office',
    searchFields: ['bureau', 'fonction', 'titulaire', 'localisation'],
    fields: [
      { name: 'bureau', label: 'Bureau', type: 'text', required: true },
      { name: 'fonction', label: 'Fonction', type: 'text', half: true },
      { name: 'titulaire', label: 'Titulaire', type: 'text', half: true },
      { name: 'localisation', label: 'Localisation', type: 'text', half: true },
    ],
    columns: [
      { key: 'bureau', label: 'Bureau', render: (e: any) => <span className="font-medium text-slate-900">{e.bureau}</span> },
      { key: 'fonction', label: 'Fonction' },
      { key: 'titulaire', label: 'Titulaire' },
      { key: 'localisation', label: 'Localisation' },
    ],
    statCards: [
      { label: 'Bureaux', value: (items: any[]) => String(items.length), hint: 'Total recensés' },
    ],
  },

  grades: {
    apiPath: '/api/grades',
    entityName: 'grade',
    entityNamePlural: 'grades',
    icon: 'badge',
    searchFields: ['grade', 'categorie'],
    fields: [
      { name: 'grade', label: 'Grade', type: 'text', required: true },
      { name: 'categorie', label: 'Catégorie', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Inactif', label: 'Inactif' },
      ] },
      { name: 'effectif', label: 'Effectif', type: 'number', half: true, default: 0 },
    ],
    columns: [
      { key: 'grade', label: 'Grade', render: (e: any) => <span className="font-medium text-slate-900">{e.grade}</span> },
      { key: 'categorie', label: 'Catégorie' },
      { key: 'effectif', label: 'Effectif' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'Inactif', label: 'Inactif' },
      ] },
    ],
    statCards: [
      { label: 'Grades', value: (items: any[]) => String(items.length) },
      { label: 'Actifs', value: (items: any[]) => String(items.filter((e) => e.statut === 'Actif').length) },
      { label: 'Effectif total', value: (items: any[]) => String(items.reduce((s, e) => s + (e.effectif || 0), 0)) },
    ],
  },

  dossiers: {
    apiPath: '/api/dossiers',
    entityName: 'dossier',
    entityNamePlural: 'dossiers',
    icon: 'folder',
    searchFields: ['reference', 'objet', 'demandeur'],
    fields: [
      { name: 'reference', label: 'Référence', type: 'text', required: true },
      { name: 'objet', label: 'Objet', type: 'text', required: true },
      { name: 'demandeur', label: 'Demandeur', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'En attente', options: [
        { value: 'En attente', label: 'En attente' },
        { value: 'En cours', label: 'En cours' },
        { value: 'Traité', label: 'Traité' },
        { value: 'Rejeté', label: 'Rejeté' },
      ] },
      { name: 'date', label: 'Date', type: 'date', half: true },
    ],
    columns: [
      { key: 'reference', label: 'Référence', render: (e: any) => <span className="font-medium text-slate-900">{e.reference}</span> },
      { key: 'objet', label: 'Objet' },
      { key: 'demandeur', label: 'Demandeur' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
      { key: 'date', label: 'Date', render: (e: any) => e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '—' },
    ],
    filters: [
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'En attente', label: 'En attente' },
        { value: 'En cours', label: 'En cours' },
        { value: 'Traité', label: 'Traité' },
        { value: 'Rejeté', label: 'Rejeté' },
      ] },
    ],
    statCards: [
      { label: 'Dossiers', value: (items: any[]) => String(items.length), hint: 'Total' },
      { label: 'En cours', value: (items: any[]) => String(items.filter((e) => e.statut === 'En cours').length) },
      { label: 'En attente', value: (items: any[]) => String(items.filter((e) => e.statut === 'En attente').length) },
      { label: 'Traités', value: (items: any[]) => String(items.filter((e) => e.statut === 'Traité').length) },
    ],
  },

  visites: {
    apiPath: '/api/visites',
    entityName: 'visite',
    entityNamePlural: 'visites',
    icon: 'visit',
    searchFields: ['etablissement', 'visiteur', 'objet'],
    fields: [
      { name: 'date', label: 'Date', type: 'date', half: true },
      { name: 'etablissement', label: 'Établissement', type: 'text', required: true, half: true },
      { name: 'visiteur', label: 'Visiteur', type: 'text', half: true },
      { name: 'objet', label: 'Objet', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', default: 'Planifiée', options: [
        { value: 'Planifiée', label: 'Planifiée' },
        { value: 'Terminée', label: 'Terminée' },
        { value: 'Annulée', label: 'Annulée' },
      ] },
    ],
    columns: [
      { key: 'date', label: 'Date', render: (e: any) => e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '—' },
      { key: 'etablissement', label: 'Établissement', render: (e: any) => <span className="font-medium text-slate-900">{e.etablissement}</span> },
      { key: 'visiteur', label: 'Visiteur' },
      { key: 'objet', label: 'Objet' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'etablissement', label: 'Tous les établissements' },
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Planifiée', label: 'Planifiée' },
        { value: 'Terminée', label: 'Terminée' },
        { value: 'Annulée', label: 'Annulée' },
      ] },
    ],
    statCards: [
      { label: 'Visites', value: (items: any[]) => String(items.length) },
      { label: 'Planifiées', value: (items: any[]) => String(items.filter((e) => e.statut === 'Planifiée').length) },
      { label: 'Terminées', value: (items: any[]) => String(items.filter((e) => e.statut === 'Terminée').length) },
    ],
  },

  services: {
    apiPath: '/api/services',
    entityName: 'serviceAdmin',
    entityNamePlural: 'serviceAdmins',
    icon: 'services',
    searchFields: ['service'],
    fields: [
      { name: 'service', label: 'Service', type: 'text', required: true },
      { name: 'procedures', label: 'Procédures', type: 'number', half: true, default: 0 },
      { name: 'dossiers', label: 'Dossiers', type: 'number', half: true, default: 0 },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'Actif', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En pause', label: 'En pause' },
      ] },
    ],
    columns: [
      { key: 'service', label: 'Service', render: (e: any) => <span className="font-medium text-slate-900">{e.service}</span> },
      { key: 'procedures', label: 'Procédures' },
      { key: 'dossiers', label: 'Dossiers' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Actif', label: 'Actif' },
        { value: 'En pause', label: 'En pause' },
      ] },
    ],
    statCards: [
      { label: 'Services', value: (items: any[]) => String(items.length) },
      { label: 'Actifs', value: (items: any[]) => String(items.filter((e) => e.statut === 'Actif').length) },
      { label: 'En pause', value: (items: any[]) => String(items.filter((e) => e.statut === 'En pause').length) },
      { label: 'Dossiers', value: (items: any[]) => String(items.reduce((s, e) => s + (e.dossiers || 0), 0)) },
    ],
  },

  notifications: {
    apiPath: '/api/notifications',
    entityName: 'notification',
    entityNamePlural: 'notifications',
    icon: 'bell',
    searchFields: ['titre', 'message', 'type'],
    fields: [
      { name: 'titre', label: 'Titre', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', half: true, options: [
        { value: 'Inscription', label: 'Inscription' },
        { value: 'Visite', label: 'Visite' },
        { value: 'Évaluation', label: 'Évaluation' },
        { value: 'Dossier', label: 'Dossier' },
        { value: 'Personnel', label: 'Personnel' },
      ] },
      { name: 'lu', label: 'Lu', type: 'checkbox', default: false },
      { name: 'message', label: 'Message', type: 'text' },
    ],
    columns: [
      { key: 'titre', label: 'Titre', render: (e: any) => <span className="font-medium text-slate-900">{e.titre}</span> },
      { key: 'type', label: 'Type' },
      { key: 'message', label: 'Message' },
      { key: 'lu', label: 'Lu', render: (e: any) => e.lu ? '✓ Oui' : '✗ Non' },
      { key: 'createdAt', label: 'Date', render: (e: any) => e.createdAt ? new Date(e.createdAt).toLocaleString('fr-FR') : '—' },
    ],
    filters: [
      { name: 'type', label: 'Tous les types', options: [
        { value: 'Inscription', label: 'Inscription' },
        { value: 'Visite', label: 'Visite' },
        { value: 'Évaluation', label: 'Évaluation' },
        { value: 'Dossier', label: 'Dossier' },
        { value: 'Personnel', label: 'Personnel' },
      ] },
    ],
    statCards: [
      { label: 'Notifications', value: (items: any[]) => String(items.length) },
      { label: 'Non lues', value: (items: any[]) => String(items.filter((e) => !e.lu).length) },
      { label: 'Lues', value: (items: any[]) => String(items.filter((e) => e.lu).length) },
    ],
  },

  paiements: {
    apiPath: '/api/paiements',
    entityName: 'paiement',
    entityNamePlural: 'paiements',
    icon: 'card',
    searchFields: ['reference', 'description'],
    fields: [
      { name: 'reference', label: 'Référence', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'text', required: true },
      { name: 'montant', label: 'Montant', type: 'text', half: true },
      { name: 'statut', label: 'Statut', type: 'select', half: true, default: 'En attente', options: [
        { value: 'Payé', label: 'Payé' },
        { value: 'En attente', label: 'En attente' },
        { value: 'Rejeté', label: 'Rejeté' },
      ] },
      { name: 'date', label: 'Date', type: 'date', half: true },
    ],
    columns: [
      { key: 'reference', label: 'Référence', render: (e: any) => <span className="font-medium text-slate-900">{e.reference}</span> },
      { key: 'description', label: 'Description' },
      { key: 'montant', label: 'Montant' },
      { key: 'date', label: 'Date', render: (e: any) => e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '—' },
      { key: 'statut', label: 'Statut', render: (e: any) => statutBadge(e.statut) },
    ],
    filters: [
      { name: 'statut', label: 'Tous les statuts', options: [
        { value: 'Payé', label: 'Payé' },
        { value: 'En attente', label: 'En attente' },
        { value: 'Rejeté', label: 'Rejeté' },
      ] },
    ],
    statCards: [
      { label: 'Paiements', value: (items: any[]) => String(items.length) },
      { label: 'Payés', value: (items: any[]) => String(items.filter((e) => e.statut === 'Payé').length) },
      { label: 'En attente', value: (items: any[]) => String(items.filter((e) => e.statut === 'En attente').length) },
      { label: 'Rejetés', value: (items: any[]) => String(items.filter((e) => e.statut === 'Rejeté').length) },
    ],
  },

  notes: {
    apiPath: '/api/notes',
    entityName: 'note',
    entityNamePlural: 'notes',
    icon: 'notebook',
    searchFields: ['eleve', 'classe'],
    fields: [
      { name: 'eleve', label: 'Élève', type: 'text', required: true },
      { name: 'classe', label: 'Classe', type: 'text', half: true },
      { name: 'devoir1', label: 'Devoir 1', type: 'text', half: true },
      { name: 'devoir2', label: 'Devoir 2', type: 'text', half: true },
      { name: 'examen', label: 'Examen', type: 'text', half: true },
      { name: 'moyenne', label: 'Moyenne', type: 'text', half: true },
      { name: 'mention', label: 'Mention', type: 'text', half: true },
    ],
    columns: [
      { key: 'eleve', label: 'Élève', render: (e: any) => <span className="font-medium text-slate-900">{e.eleve}</span> },
      { key: 'classe', label: 'Classe' },
      { key: 'devoir1', label: 'Devoir 1' },
      { key: 'devoir2', label: 'Devoir 2' },
      { key: 'examen', label: 'Examen' },
      { key: 'moyenne', label: 'Moyenne' },
      { key: 'mention', label: 'Mention' },
    ],
    filters: [
      { name: 'classe', label: 'Toutes les classes' },
    ],
    statCards: [
      { label: 'Notes', value: (items: any[]) => String(items.length), hint: 'Total' },
      { label: 'Classes', value: (items: any[]) => String(new Set(items.map((e) => e.classe)).size) },
    ],
  },
};
