/** Catégories de l'espace documentaire de la Coordination nationale EC-ERC. */
export const NATIONAL_DOCUMENT_CATEGORIES = [
  { value: 'circulaire', label: 'Circulaire nationale' },
  { value: 'decision', label: 'Décision officielle' },
  { value: 'lettre', label: 'Lettre administrative' },
  { value: 'rapport', label: 'Rapport provincial' }
] as const;

export type NationalDocumentCategorie = (typeof NATIONAL_DOCUMENT_CATEGORIES)[number]['value'];

export const NATIONAL_DOCUMENT_CATEGORY_VALUES: readonly string[] = NATIONAL_DOCUMENT_CATEGORIES.map((c) => c.value);

export function documentCategorieLabel(value: string): string {
  return NATIONAL_DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
