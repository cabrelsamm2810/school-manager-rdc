import { CLASSES_RDC, MATIERES_RDC, type CycleRdc } from '@/lib/curriculum-rdc';

/**
 * Cycles utilisant le flux simple (titulaire → classe → présence).
 * Maternel et Primaire (1ère à 6ème année).
 */
const SIMPLE_CYCLES: CycleRdc[] = ['Maternel', 'Primaire'];

/**
 * Détermine si une classe utilise le flux simple (titulaire → classe → présence).
 * Concerné : Maternel, Primaire (1ère à 6ème année).
 */
export function isSimpleFlowClass(classeName: string): boolean {
  const entry = CLASSES_RDC.find((c) => c.nom === classeName);
  if (entry) return SIMPLE_CYCLES.includes(entry.cycle);

  // Repli par mots-clés : les classes contenant ces termes sont en flux séance
  const lower = classeName.toLowerCase();
  if (
    lower.includes('humanit') ||
    lower.includes('secondaire') ||
    lower.includes('7ème') || lower.includes('8ème') ||
    lower.includes('7eme') || lower.includes('8eme') ||
    lower.includes('cteb')
  ) {
    return false;
  }
  return true;
}

/**
 * Détermine si une classe utilise le flux par séance
 * (professeur → classe → matière → séance → présence).
 * Concerné : CTEB (7ème et 8ème année), Secondaire Général et Technique
 * (1ère à 4ème Humanités).
 */
export function isSessionFlowClass(classeName: string): boolean {
  return !isSimpleFlowClass(classeName);
}

/**
 * Retourne le cycle éducatif RDC pour une classe donnée.
 */
export function getCycleForClass(classeName: string): CycleRdc | null {
  const entry = CLASSES_RDC.find((c) => c.nom === classeName);
  return entry?.cycle ?? null;
}

/**
 * Retourne les matières du programme national pour un cycle donné.
 */
export function getMatieresForCycle(cycle: CycleRdc): string[] {
  return MATIERES_RDC.filter((m) => m.cycle === cycle).map((m) => m.nom);
}
