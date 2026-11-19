/**
 * Types et libellés des documents institutionnels de la Coordination
 * nationale EC-ERC. Module pur (sans Prisma ni serveur) : importable par
 * les routes API comme par les composants clients.
 */

export const NATIONAL_DOCUMENT_TYPES = [
  { value: 'CIRCULAIRE', label: 'Circulaire', icon: 'document', description: 'Instructions adressées aux coordinations provinciales.' },
  { value: 'DECISION', label: 'Décision', icon: 'check', description: 'Actes administratifs et décisions officielles.' },
  { value: 'LETTRE_OFFICIELLE', label: 'Lettre officielle', icon: 'send', description: 'Correspondance officielle du niveau national.' },
  { value: 'RAPPORT_PROVINCIAL', label: 'Rapport provincial', icon: 'chart', description: 'Rapports transmis par les coordinations provinciales.' },
  { value: 'DOCUMENT_ADMIN', label: 'Document administratif', icon: 'folder', description: 'Pièces et documents de gestion administrative.' },
] as const;

export type NationalDocumentType = (typeof NATIONAL_DOCUMENT_TYPES)[number]['value'];

export const NATIONAL_DOCUMENT_TYPE_VALUES: readonly string[] = NATIONAL_DOCUMENT_TYPES.map(
  (t) => t.value,
);

export const NATIONAL_DOCUMENT_STATUTS = ['Brouillon', 'Publié', 'Archivé'] as const;

export function documentTypeLabel(type: string): string {
  return NATIONAL_DOCUMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function documentTypeIcon(type: string): string {
  return NATIONAL_DOCUMENT_TYPES.find((t) => t.value === type)?.icon ?? 'document';
}

export function documentStatutColor(statut: string): 'green' | 'amber' | 'slate' {
  if (statut === 'Publié') return 'green';
  if (statut === 'Brouillon') return 'amber';
  return 'slate';
}
