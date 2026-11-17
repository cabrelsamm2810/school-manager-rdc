/**
 * Extraction des données d'écoles à partir du texte brut renvoyé par l'OCR
 * (import par photo de la console Admin SMD et de la page Écoles).
 *
 * Module pur — aucune dépendance navigateur — pour être testable directement.
 */

import {
  MAX_IMPORT_LINES,
  type FieldConfidence,
  type ParsedSchoolRow,
} from '@/lib/txt-import-parser';

/** Mots-clés typiques dans les noms d'écoles (insensible aux accents/casse). */
const SCHOOL_KEYWORDS = [
  'ecole', 'institut', 'complex', 'college', 'lycee', 'centre', 'groupe',
  'etablissement', 'academie', 'universite', 'faculte', 'section', 'annexe',
  'programme', 'project', 'scolaire', 'polytechnique', 'technique',
  'professionnel', 'maternelle', 'primaire', 'secondaire', 'fondamental',
];

/** Mots-clés d'en-têtes administratifs à exclure (insensible aux accents/casse). */
const HEADER_KEYWORDS = [
  'republique', 'ministere', 'gouvernement', 'secretariat', 'direction',
  'inspection', 'coordination', 'sous-province', 'province de',
  'division provinciale', 'liste des ecoles', 'liste des etablissements',
  'annuaire', 'catalogue', 'table des matieres', 'sommaire',
  'democratique du congo', 'kinshasa, le', 'fait a', 'arrete a',
  // En-têtes de bandeau photographiés au-dessus de la liste
  'province educationnelle', 'sous-division', 'epst',
];

/** Patterns pour détecter un numéro de téléphone (format RDC). */
const PHONE_REGEX = /(?:\+243\s?|0)[89]\d{2}[\s.\-]?\d{3}[\s.\-]?\d{3}/;

/** Mots-clés d'adresse (insensible aux accents/casse). */
const ADDRESS_KEYWORDS = [
  'avenue', 'av ', 'av.', 'rue', 'boulevard', 'bd ', 'bd.', 'quartier',
  'q. ', 'q,', 'commune', 'n°', 'no ', 'numero', 'num ', 'lot ', 'parcelle',
  'crossing', 'marche', 'marché', 'pres de', 'près de', 'face a', 'face à',
];

/** Mots-clés de chef d'établissement (insensible aux accents/casse). */
const DIRECTOR_KEYWORDS = [
  'directeur', 'directrice', 'chef d', 'chef de', 'responsable',
  'principal', 'recteur', 'regisseur', 'régisseur', 'fondateur',
  'dir. ', 'dir.', 'cd ', 'cd.',
];

/** Patterns de bruit à exclure (numéros de page, dates seules, lignes de séparation, etc.). */
const NOISE_PATTERNS = [
  /^page\s+\d+/i,
  /^page\s+\d+\s*\/\s*\d+$/i,
  /^\d+\s*\/\s*\d+$/,
  /^\d{1,3}$/,
  /^[#*•\-_=~]{2,}$/,
  /^(date|signature|cachet|nom|prenom|post[- ]?nom)\s*[:.]?$/i,
  /^(n[°o]?\s*)?[:.]?\s*\d{4,}$/i,
  /^\[?\d{1,2}\s*[\).\-]\s*$/,
  /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s*[:.]?$/i,
  /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/,
  // Bandeau territorial seul (« COMMUNE DE GOMBE »), pas une adresse en fin de ligne
  /^(commune|ville|district|sous-province)\s+d[eu]\s/i,
];

function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Vérifie si une ligne est du bruit OCR (pas une donnée d'école). */
function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return true;
  // Un numéro de téléphone seul sur sa ligne est une donnée, pas du bruit
  if (PHONE_REGEX.test(trimmed)) return false;
  if (NOISE_PATTERNS.some((p) => p.test(trimmed))) return true;
  // Ligne composée uniquement de chiffres et ponctuation
  if (/^[\d\s\-.,;:|/()]+$/.test(trimmed)) return true;
  // En-têtes administratifs (République, Ministère, etc.)
  const norm = normalizeText(trimmed);
  if (HEADER_KEYWORDS.some((kw) => norm.includes(kw))) return true;
  // Ligne en MAJUSCULES de plus de 40 caractères = probablement un en-tête/bandeau
  if (trimmed.length > 40 && trimmed === trimmed.toUpperCase() && !/[a-zà-ÿ]/.test(trimmed)) return true;
  return false;
}

/** Vrai si la ligne contient un mot-clé fort de nom d'école (École, Institut, …). */
function hasSchoolKeyword(text: string): boolean {
  const norm = normalizeText(text);
  return SCHOOL_KEYWORDS.some((kw) => norm.includes(kw));
}

/** Nettoie une ligne en supprimant la numérotation de début (ex: "1. École…" → "École…"). */
function cleanLinePrefix(line: string): string {
  return line.replace(/^\[?\s*\d{1,3}\s*[\).\-:]\s*/, '').trim();
}

/** Vérifie si un texte ressemble à un nom d'école. */
function looksLikeSchoolName(text: string): boolean {
  const norm = normalizeText(text);
  if (norm.length < 3) return false;
  if (!/[a-zà-ÿ]/i.test(text)) return false;
  // Doit contenir au moins un mot de 3+ lettres
  if (!/[a-zà-ÿ]{3,}/i.test(text)) return false;
  // Doit contenir un mot-clé d'école OU avoir une structure plausible (initiale + mots)
  if (SCHOOL_KEYWORDS.some((kw) => norm.includes(kw))) return true;
  // Repli strict : au moins 2 mots alphabétiques de 3+ lettres (ex: "Bon Berger", "Saint Joseph")
  const words = norm.split(/\s+/).filter((w) => w.length >= 3 && /[a-zà-ÿ]{3,}/i.test(w));
  return words.length >= 2;
}

/** Extrait un numéro de téléphone d'une ligne, ou null si absent. */
function extractPhone(line: string): string | null {
  const m = line.match(PHONE_REGEX);
  return m ? m[0].replace(/\s+/g, ' ').trim() : null;
}

/** Extrait une adresse d'une ligne, ou null si la ligne n'en contient pas. */
function extractAddress(line: string): string | null {
  const norm = normalizeText(line);
  if (!ADDRESS_KEYWORDS.some((kw) => norm.includes(kw))) return null;
  // Nettoyer les préfixes d'étiquette (ex: "Adresse: Av. ..." → "Av. ...")
  const cleaned = line.replace(/^(adresse|addr|localisation)\s*[:.]?\s*/i, '').trim();
  return cleaned.length >= 5 ? cleaned : null;
}

/** Extrait le nom du chef d'établissement d'une ligne, ou null si absent. */
function extractDirector(line: string): string | null {
  const norm = normalizeText(line);
  if (!DIRECTOR_KEYWORDS.some((kw) => norm.includes(kw))) return null;
  // Extraire la partie après le mot-clé et un séparateur (: , = -)
  // `chef d'établissement` (accentué) : consommer le mot suivant la préposition
  const match = line.match(/(?:directeur|directrice|chef\s+d[’'e]\S*|responsable|principal|recteur|r[ée]gisseur|fondateur|dir\.?|cd\.?)\s*[:\-,\=]?\s*(.+)/i);
  if (!match) return null;
  const name = match[1].trim();
  // Garder uniquement si ça ressemble à un nom (au moins 2 lettres, pas trop long)
  if (name.length < 3 || name.length > 80) return null;
  return name;
}

/**
 * Extraction des données d'écoles depuis le texte OCR.
 * Détecte le nom, l'adresse, le téléphone et le chef d'établissement.
 */
export function extractSchoolData(text: string): { rows: ParsedSchoolRow[]; warnings: string[]; confidences: Partial<Record<string, FieldConfidence>>[] } {
  const warnings: string[] = [];
  const allLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (allLines.length === 0) {
    return { rows: [], warnings: ['Aucun texte détecté.'], confidences: [] };
  }

  const lines = allLines.filter((l) => !isNoiseLine(l));

  if (lines.length === 0) {
    return { rows: [], warnings: ['Aucune ligne valide détectée après filtrage du bruit OCR.'], confidences: [] };
  }

  if (lines.length > MAX_IMPORT_LINES) {
    warnings.push(`Le texte contient ${lines.length} lignes. Seules les ${MAX_IMPORT_LINES} premières seront traitées.`);
  }

  const cappedLines = lines.slice(0, MAX_IMPORT_LINES);
  const rows: ParsedSchoolRow[] = [];
  const confidences: Partial<Record<string, FieldConfidence>>[] = [];
  const seen = new Set<string>();
  /** Lignes déjà consommées comme adresse / téléphone / chef de l'école précédente. */
  const consumed = new Set<number>();

  for (let i = 0; i < cappedLines.length; i++) {
    if (consumed.has(i)) continue;
    const line = cappedLines[i];
    const nom = cleanLinePrefix(line);
    if (!nom || !looksLikeSchoolName(nom)) continue;
    const key = normalizeText(nom);
    if (seen.has(key)) continue;
    seen.add(key);

    // Chercher adresse, téléphone et chef dans les lignes suivantes (max 5 lignes)
    let adresse = '';
    let telephone = '';
    let chefEcole = '';

    for (let j = i + 1; j < Math.min(i + 6, cappedLines.length); j++) {
      const next = cappedLines[j];
      const nextNom = cleanLinePrefix(next);
      const nextPhone = extractPhone(next);
      const nextAddress = extractAddress(next);
      const nextDirector = extractDirector(next);

      // Une ligne suivante qui nomme une école (mot-clé fort, ou nom plausible sans
      // adresse) commence un nouveau bloc : les attributs de l'école courante sont
      // terminés. Une ligne d'adresse / téléphone / chef reste une continuation.
      const startsNewSchool =
        looksLikeSchoolName(nextNom) &&
        !nextPhone &&
        !nextDirector &&
        (hasSchoolKeyword(nextNom) || !nextAddress);
      if (startsNewSchool) break;
      if (!telephone && nextPhone) { telephone = nextPhone; consumed.add(j); continue; }
      if (!adresse && nextAddress) { adresse = nextAddress; consumed.add(j); continue; }
      if (!chefEcole && nextDirector) { chefEcole = nextDirector; consumed.add(j); continue; }
    }

    rows.push({
      nom, type: '', institution: '', dinacope: '', province: '',
      provinceEducationnelle: '', ville: '', commune: '', adresse,
      telephone, email: '', chefEcole, effectif: '',
    });
    // Score de confiance par champ
    const normNom = normalizeText(nom);
    confidences.push({
      nom: SCHOOL_KEYWORDS.some((kw) => normNom.includes(kw)) ? 'high' : 'medium',
      telephone: telephone ? 'high' : null,
      adresse: adresse ? 'high' : null,
      chefEcole: chefEcole ? 'high' : null,
    });
  }

  return { rows, warnings, confidences };
}
