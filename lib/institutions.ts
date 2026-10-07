/**
 * Configuration des institutions scolaires de la RDC et de leur parcours administratif.
 *
 * Chaque institution possède son propre chemin hiérarchique :
 *   Institution → Province → Province éducationnelle → Structure compétente → École
 *
 * Les écoles d'une institution ne doivent jamais apparaître dans les dashboards d'une autre.
 */

import { ROLE_RANK } from '@/lib/rbac';

export type InstitutionCode =
  | 'EC_ERC'
  | 'PUBLIQUE'
  | 'CATHOLIQUE'
  | 'ISLAMIQUE'
  | 'INDEPENDANTE';

export type AdminLevel = {
  key: string;
  label: string;
  model: string; // nom du modèle Prisma correspondant
  apiPath: string; // endpoint CRUD pour charger les options
};

export type InstitutionConfig = {
  code: InstitutionCode;
  label: string;
  description: string;
  color: string; // tailwind text color
  bgColor: string; // tailwind bg color
  borderColor: string;
  icon: string;
  /** Parcours administratif de haut en bas (national → école). */
  adminPath: AdminLevel[];
  /** La structure compétente qui reçoit le dossier pour validation. */
  structureCompetente: string; // model name
};

export const INSTITUTIONS: InstitutionConfig[] = [
  {
    code: 'EC_ERC',
    label: 'EC-ERC — Écoles Conventionnées des Églises du Réveil du Congo',
    description: 'Écoles Conventionnées des Églises du Réveil du Congo',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'organization',
    adminPath: [
      { key: 'coordNationale', label: 'Coordination nationale', model: 'coordNationale', apiPath: '/api/coordination-nationale' },
      { key: 'coordProvinciale', label: 'Coordination provinciale', model: 'coordProvinciale', apiPath: '/api/coordination-provinciale' },
      { key: 'coordSousProvinciale', label: 'Coordination sous-provinciale', model: 'coordSousProvinciale', apiPath: '/api/coordination-sous-provinciale' },
    ],
    structureCompetente: 'coordSousProvinciale',
  },
  {
    code: 'PUBLIQUE',
    label: 'Écoles publiques',
    description: 'Écoles publiques sous tutelle de l\'EPST',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: 'school',
    adminPath: [
      { key: 'coordNationale', label: 'Coordination nationale', model: 'coordNationale', apiPath: '/api/coordination-nationale' },
      { key: 'coordProvinciale', label: 'Coordination provinciale', model: 'coordProvinciale', apiPath: '/api/coordination-provinciale' },
      { key: 'coordSousProvinciale', label: 'Coordination sous-provinciale', model: 'coordSousProvinciale', apiPath: '/api/coordination-sous-provinciale' },
    ],
    structureCompetente: 'coordSousProvinciale',
  },
  {
    code: 'CATHOLIQUE',
    label: 'Écoles conventionnées catholiques',
    description: 'Écoles conventionnées de l\'Église catholique (CENCO)',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: 'school',
    adminPath: [
      { key: 'coordNationale', label: 'Coordination nationale', model: 'coordNationale', apiPath: '/api/coordination-nationale' },
      { key: 'coordProvinciale', label: 'Coordination provinciale', model: 'coordProvinciale', apiPath: '/api/coordination-provinciale' },
      { key: 'coordSousProvinciale', label: 'Coordination sous-provinciale', model: 'coordSousProvinciale', apiPath: '/api/coordination-sous-provinciale' },
    ],
    structureCompetente: 'coordSousProvinciale',
  },
  {
    code: 'ISLAMIQUE',
    label: 'Écoles islamiques',
    description: 'Écoles sous tutelle de la communauté islamique',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: 'school',
    adminPath: [
      { key: 'coordNationale', label: 'Coordination nationale', model: 'coordNationale', apiPath: '/api/coordination-nationale' },
      { key: 'coordProvinciale', label: 'Coordination provinciale', model: 'coordProvinciale', apiPath: '/api/coordination-provinciale' },
      { key: 'coordSousProvinciale', label: 'Coordination sous-provinciale', model: 'coordSousProvinciale', apiPath: '/api/coordination-sous-provinciale' },
    ],
    structureCompetente: 'coordSousProvinciale',
  },
  {
    code: 'INDEPENDANTE',
    label: 'Écoles indépendantes',
    description: 'Écoles privées et indépendantes',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: 'school',
    adminPath: [
      { key: 'coordNationale', label: 'Coordination nationale', model: 'coordNationale', apiPath: '/api/coordination-nationale' },
      { key: 'coordProvinciale', label: 'Coordination provinciale', model: 'coordProvinciale', apiPath: '/api/coordination-provinciale' },
      { key: 'coordSousProvinciale', label: 'Coordination sous-provinciale', model: 'coordSousProvinciale', apiPath: '/api/coordination-sous-provinciale' },
    ],
    structureCompetente: 'coordSousProvinciale',
  },
];

export const INSTITUTION_MAP: Record<string, InstitutionConfig> = Object.fromEntries(
  INSTITUTIONS.map((i) => [i.code, i]),
);

export function getInstitution(code: string): InstitutionConfig | undefined {
  return INSTITUTION_MAP[code];
}

/** Codes d'institution pour les listes déroulantes. */
export const institutionOptions = INSTITUTIONS.map((i) => ({
  value: i.code,
  label: i.label,
}));

/* ── Statuts de validation d'un école ── */

export type ValidationStatut =
  | 'Brouillon'
  | 'En attente de vérification'
  | 'En cours de vérification'
  | 'Validée'
  | 'Rejetée'
  | 'Suspendue';

export const VALIDATION_STATUTS: ValidationStatut[] = [
  'Brouillon',
  'En attente de vérification',
  'En cours de vérification',
  'Validée',
  'Rejetée',
  'Suspendue',
];

export const VALIDATION_STATUT_COLORS: Record<string, { color: 'slate' | 'amber' | 'blue' | 'green' | 'red' | 'purple'; label: string }> = {
  'Brouillon': { color: 'slate', label: 'Brouillon' },
  'En attente de vérification': { color: 'amber', label: 'En attente de vérification' },
  'En cours de vérification': { color: 'blue', label: 'En cours de vérification' },
  'Validée': { color: 'green', label: 'Validée' },
  'Rejetée': { color: 'red', label: 'Rejetée' },
  'Suspendue': { color: 'purple', label: 'Suspendue' },
};

/** Types de documents justificatifs attendus. */
export const DOCUMENT_TYPES = [
  'Autorisation d\'ouverture',
  'Accréditation',
  'Arrêté ministériel',
  'Statut de l\'école',
  'Liste du personnel',
  'Plan de l\'infrastructure',
  'Reçu DINACOPE',
  'Autre',
];

/** Génère un identifiant School Manager au format SM-{INST}-{AAAA}-{NNNN}. */
export function generateIdentifiantSM(institution: string): string {
  const prefix = institution.slice(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SM-${prefix}-${year}-${random}`;
}

/* ── Flux de validation hiérarchique ──
 *
 * Chaque transition précise le rôle minimum requis pour l'effectuer.
 * Le flux respecte la hiérarchie administrative :
 *   DIRECTION_ECOLE soumet → AGENT_SOUS_PROVINCIAL (et au-dessus) vérifie et valide.
 */

export type ValidationTransition = {
  from: ValidationStatut;
  to: ValidationStatut;
  minRole: string;
};

export const VALIDATION_TRANSITIONS: ValidationTransition[] = [
  { from: 'Brouillon', to: 'En attente de vérification', minRole: 'DIRECTION_ECOLE' },
  { from: 'En attente de vérification', to: 'En cours de vérification', minRole: 'COORDINATION_SOUS_PROVINCIALE' },
  { from: 'En attente de vérification', to: 'Validée', minRole: 'AGENT_SOUS_PROVINCIAL' },
  { from: 'En attente de vérification', to: 'Rejetée', minRole: 'AGENT_SOUS_PROVINCIAL' },
  { from: 'En cours de vérification', to: 'Validée', minRole: 'AGENT_SOUS_PROVINCIAL' },
  { from: 'En cours de vérification', to: 'Rejetée', minRole: 'AGENT_SOUS_PROVINCIAL' },
  { from: 'Validée', to: 'Suspendue', minRole: 'COORDINATION_SOUS_PROVINCIALE' },
  { from: 'Rejetée', to: 'Brouillon', minRole: 'DIRECTION_ECOLE' },
  { from: 'Suspendue', to: 'Brouillon', minRole: 'COORDINATION_SOUS_PROVINCIALE' },
  { from: 'Suspendue', to: 'Validée', minRole: 'COORDINATION_SOUS_PROVINCIALE' },
];

/**
 * Vérifie qu'une transition de statut est autorisée pour un rôle donné.
 * SUPER_ADMIN peut effectuer toutes les transitions.
 */
export function canTransition(from: string, to: string, role: string): boolean {
  if (from === to) return false;
  if (role === 'SUPER_ADMIN') return true;
  const transition = VALIDATION_TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!transition) return false;
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[transition.minRole] ?? 0);
}
