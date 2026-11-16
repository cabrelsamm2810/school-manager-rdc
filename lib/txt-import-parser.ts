/**
 * Parser pour l'importation d'écoles depuis un fichier TXT.
 *
 * Supporte :
 * - Les listes simples (un nom d'école par ligne)
 * - Les listes structurées avec en-tête (séparateurs : |, ;, tabulation, virgule)
 * - La détection automatique du séparateur et de l'en-tête
 */

export type ParsedSchoolRow = {
  nom: string;
  type: string;
  institution: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  adresse: string;
  telephone: string;
  email: string;
  chefEcole: string;
  effectif: string;
};

export type ParseResult = {
  rows: ParsedSchoolRow[];
  separator: string;
  hasHeader: boolean;
  warnings: string[];
};

export type RowStatus = 'ok' | 'warning' | 'error';

export type FieldConfidence = 'high' | 'medium' | 'low' | null;

export type PreviewRow = ParsedSchoolRow & {
  rowIndex: number;
  status: RowStatus;
  messages: string[];
  duplicateId?: string;
  duplicateNom?: string;
  fieldConfidence?: Partial<Record<keyof ParsedSchoolRow, FieldConfidence>>;
};

/** Colonnes reconnues dans l'en-tête d'un fichier TXT structuré. */
export const TXT_COLUMNS: { key: keyof ParsedSchoolRow; label: string; required?: boolean }[] = [
  { key: 'nom', label: "Nom de l'école", required: true },
  { key: 'institution', label: 'Convention' },
  { key: 'type', label: 'Type' },
  { key: 'dinacope', label: 'DINACOPE' },
  { key: 'province', label: 'Province' },
  { key: 'provinceEducationnelle', label: 'Province éduc.' },
  { key: 'commune', label: 'Sous-division' },
  { key: 'ville', label: 'Ville' },
  { key: 'adresse', label: 'Adresse' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
  { key: 'chefEcole', label: "Chef d'école" },
  { key: 'effectif', label: 'Effectif' },
];

/** Alias d'en-tête → champ cible (insensible à la casse et aux accents). */
const HEADER_ALIASES: Record<string, keyof ParsedSchoolRow> = {
  nom: 'nom',
  "nom de l'ecole": 'nom',
  "nom de l'école": 'nom',
  "nom de l ecole": 'nom',
  ecole: 'nom',
  école: 'nom',
  denomination: 'nom',
  convention: 'institution',
  institution: 'institution',
  type: 'type',
  dinacope: 'dinacope',
  province: 'province',
  'province administrative': 'province',
  'province educationnelle': 'provinceEducationnelle',
  'province éducationnelle': 'provinceEducationnelle',
  'province educ': 'provinceEducationnelle',
  'prov educ': 'provinceEducationnelle',
  'sous-division': 'commune',
  'sous division': 'commune',
  'sousdivision': 'commune',
  commune: 'commune',
  ville: 'ville',
  adresse: 'adresse',
  telephone: 'telephone',
  téléphone: 'telephone',
  tel: 'telephone',
  email: 'email',
  'e-mail': 'email',
  chef: 'chefEcole',
  "chef d'ecole": 'chefEcole',
  "chef d'école": 'chefEcole',
  directeur: 'chefEcole',
  effectif: 'effectif',
};

const SEPARATORS = [
  { label: 'Barre |', value: '|', char: '|' },
  { label: 'Point-virgule', value: ';', char: ';' },
  { label: 'Tabulation', value: '\t', char: '\t' },
  { label: 'Virgule', value: ',', char: ',' },
];

/** Normalise une chaîne d'en-tête pour la comparaison. */
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Tente de faire correspondre un nom d'en-tête à un champ connu. */
function matchHeader(header: string): keyof ParsedSchoolRow | null {
  const h = normalizeHeader(header);
  if (HEADER_ALIASES[h]) return HEADER_ALIASES[h];
  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (h.includes(alias) || alias.includes(h)) return field;
  }
  return null;
}

/** Détecte le séparateur le plus probable dans les premières lignes. */
function detectSeparator(lines: string[]): string {
  let bestSep = '|';
  let bestScore = 0;
  for (const sep of SEPARATORS) {
    let count = 0;
    for (const line of lines.slice(0, 5)) {
      count += line.split(sep.char).length - 1;
    }
    if (count > bestScore) {
      bestScore = count;
      bestSep = sep.value;
    }
  }
  return bestSep;
}

/** Normalise le code institution (EC-ERC → EC_ERC). */
export function normalizeInstitution(value: string): string {
  const v = value.trim().toUpperCase();
  if (v === 'EC-ERC' || v === 'EC_ERC') return 'EC_ERC';
  return v;
}

function createEmptyRow(): ParsedSchoolRow {
  return {
    nom: '', type: '', institution: '', dinacope: '', province: '',
    provinceEducationnelle: '', ville: '', commune: '', adresse: '',
    telephone: '', email: '', chefEcole: '', effectif: '',
  };
}

/** Limite maximale de lignes par import. */
export const MAX_IMPORT_LINES = 500;

/**
 * Parse le contenu d'un fichier TXT en lignes d'écoles.
 */
export function parseTxtContent(content: string): ParseResult {
  const warnings: string[] = [];
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], separator: '|', hasHeader: false, warnings: ['Le fichier est vide.'] };
  }

  if (lines.length > MAX_IMPORT_LINES) {
    warnings.push(`Le fichier contient ${lines.length} lignes. Seules les ${MAX_IMPORT_LINES} premières seront traitées.`);
  }

  const cappedLines = lines.slice(0, MAX_IMPORT_LINES);

  // Détection du séparateur
  const separator = detectSeparator(cappedLines);
  const sepChar = SEPARATORS.find((s) => s.value === separator)?.char ?? '|';

  // Détection de l'en-tête
  const firstLineFields = cappedLines[0].split(sepChar).map((s) => s.trim());
  const headerMatches = firstLineFields.map((f) => matchHeader(f));
  const matchedCount = headerMatches.filter((m) => m !== null).length;
  const hasHeader = matchedCount >= 2;

  let colMap: (keyof ParsedSchoolRow | null)[] = [];
  if (hasHeader) {
    colMap = headerMatches;
  }

  const dataLines = hasHeader ? cappedLines.slice(1) : cappedLines;
  const rows: ParsedSchoolRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const fields = dataLines[i].split(sepChar).map((s) => s.trim());

    if (hasHeader && colMap.length > 0) {
      const row = createEmptyRow();
      fields.forEach((val, idx) => {
        const field = colMap[idx];
        if (field) (row[field] as string) = val;
      });
      rows.push(row);
    } else {
      // Liste simple : chaque ligne est un nom d'école
      const nom = fields[0]?.trim() || '';
      if (nom) {
        rows.push({ ...createEmptyRow(), nom });
      } else {
        warnings.push(`Ligne ${i + 1} : ligne vide ignorée.`);
      }
    }
  }

  // Avertissements pour les lignes incomplètes
  rows.forEach((row, i) => {
    if (!row.nom.trim()) {
      warnings.push(`Ligne ${i + 1} : nom de l'école manquant.`);
    }
  });

  return { rows, separator, hasHeader, warnings };
}

/** Génère un exemple de fichier TXT téléchargeable. */
export function generateExampleTxt(): string {
  return [
    "Nom de l'école | Convention | Province éducationnelle | Sous-division | Adresse",
    'École primaire Exemple | EC-ERC | Kinshasa Mont-Amba | Lemba | Kinshasa',
    'Institut Exemple | EC-ERC | Kinshasa Funa | Kalamu | Kinshasa',
    'Complex Scolaire Tuendelee | EC-ERC | Kinshasa Tshangu | Masina | Kinshasa',
    '',
    '--- Ou liste simple (un nom par ligne) ---',
    'École primaire Exemple',
    'Institut Exemple',
    'Complex Scolaire Tuendelee',
  ].join('\n');
}
