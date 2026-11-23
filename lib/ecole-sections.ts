/**
 * Sections scolaires qu'un établissement peut organiser, et correspondance
 * avec les cycles du curriculum national (`lib/curriculum-rdc.ts`).
 *
 * Un établissement ne propose que les sections qu'il a explicitement
 * configurées dans son profil (module Écoles → fiche → Sections & options).
 * Les modules d'inscription, de classes, d'enseignants et de bulletins
 * s'appuient sur cette correspondance pour ne jamais proposer une section
 * ou une option que l'école n'organise pas.
 */
import { CLASSES_RDC, type ClasseRdc, type CycleRdc } from '@/lib/curriculum-rdc';

export const SECTIONS_SCOLAIRES = ['Maternelle', 'Primaire', 'Secondaire', 'Humanités'] as const;

export type SectionScolaire = (typeof SECTIONS_SCOLAIRES)[number];

/** Cycles nationaux couverts par chaque section. */
export const CYCLES_PAR_SECTION: Record<SectionScolaire, CycleRdc[]> = {
  Maternelle: ['Maternel'],
  Primaire: ['Primaire'],
  Secondaire: ['CTEB'],
  Humanités: ['Secondaire Général', 'Secondaire Technique'],
};

export function isSectionScolaire(value: string): value is SectionScolaire {
  return (SECTIONS_SCOLAIRES as readonly string[]).includes(value);
}

/** Section à laquelle appartient un cycle national (ou null si inconnu). */
export function sectionForCycle(cycle: string): SectionScolaire | null {
  for (const section of SECTIONS_SCOLAIRES) {
    if (CYCLES_PAR_SECTION[section].includes(cycle as CycleRdc)) return section;
  }
  return null;
}

/** Cycles nationaux correspondant aux sections organisées par l'école. */
export function cyclesForSections(sections: string[]): CycleRdc[] {
  const set = new Set<CycleRdc>();
  for (const section of sections) {
    if (isSectionScolaire(section)) {
      for (const cycle of CYCLES_PAR_SECTION[section]) set.add(cycle);
    }
  }
  return [...set];
}

/**
 * Classes nationales autorisées par les sections organisées par l'école.
 * Sans section configurée, la liste complète est retournée : aucune école
 * existante ne perd ses classes tant qu'elle n'a pas configuré ses sections.
 */
export function classesForSections(sections: string[]): ClasseRdc[] {
  if (sections.length === 0) return CLASSES_RDC;
  const cycles = cyclesForSections(sections);
  return CLASSES_RDC.filter((c) => cycles.includes(c.cycle));
}

/** Forme minimale d'une section configurée, avec ses options actives. */
export type SectionConfiguree = {
  nom: string;
  statut: string;
  options: { nom: string; statut: string }[];
};

/** Sections actives d'une structure école. */
export function activeSections(sections: SectionConfiguree[]): SectionConfiguree[] {
  return sections.filter((s) => s.statut === 'Actif');
}

/** Options actives d'une section donnée. */
export function activeOptionsFor(sections: SectionConfiguree[], section: string): string[] {
  const found = sections.find((s) => s.nom === section);
  if (!found) return [];
  return found.options.filter((o) => o.statut === 'Actif').map((o) => o.nom);
}
