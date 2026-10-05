/**
 * Constantes et fonctions de calcul pour le Cahier de cote.
 * Système de cotation officiel de la RDC (sur 20).
 */

export const PERIODES = [
  '1er Trimestre',
  '2e Trimestre',
  '3e Trimestre',
] as const;

export const STATUTS = [
  'Brouillon',
  'Enregistré',
  'Validé',
] as const;

/** Année scolaire courante au format "2025-2026". */
export function getCurrentAnneeScolaire(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // L'année scolaire commence en septembre
  if (month >= 9) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

/**
 * Calcule le total, la moyenne, le pourcentage et la mention
 * à partir des trois cotes (devoir1, devoir2, examen), chacune sur 20.
 */
export function calculateGrades(devoir1: number, devoir2: number, examen: number) {
  const d1 = clampCote(devoir1);
  const d2 = clampCote(devoir2);
  const ex = clampCote(examen);
  const total = round2(d1 + d2 + ex);
  const moyenne = round2(total / 3);
  const pourcentage = round2((moyenne / 20) * 100);
  const mention = getMention(pourcentage);
  return { total, moyenne, pourcentage, mention };
}

/** Détermine la mention selon le pourcentage. */
export function getMention(pourcentage: number): string {
  if (pourcentage >= 90) return 'Excellent';
  if (pourcentage >= 80) return 'Très Bien';
  if (pourcentage >= 70) return 'Bien';
  if (pourcentage >= 60) return 'Assez Bien';
  if (pourcentage >= 50) return 'Passable';
  return 'Insuffisant';
}

/** Valide qu'une cote est comprise entre 0 et 20. */
export function isValidCote(value: number): boolean {
  return !isNaN(value) && value >= 0 && value <= 20;
}

function clampCote(value: number): number {
  if (isNaN(value) || value < 0) return 0;
  if (value > 20) return 20;
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Génère un token unique pour le QR code du bulletin. */
export function generateQrToken(): string {
  return 'BUL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}
