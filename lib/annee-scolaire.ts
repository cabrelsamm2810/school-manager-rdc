/**
 * Année scolaire en cours en RDC : la rentrée a lieu en septembre.
 * Même règle que le module Présences (`/presences-qr`), pour que la fiche
 * élève et les présences affichent la même année.
 */
export function currentAnneeScolaire(date: Date = new Date()): string {
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${year + 1}`;
}
