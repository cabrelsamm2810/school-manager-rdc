/**
 * Vérifie qu'une école est « bien configurée » avant de pouvoir envoyer
 * son dossier à la coordination pour validation.
 *
 * Un école bien configurée a tous les champs administratifs essentiels
 * remplis : identification, rattachement hiérarchique et contact.
 */

export type EcoleConfigField = {
  key: string;
  label: string;
};

/** Champs obligatoires pour qu'une école soit considérée « bien configurée ». */
export const REQUIRED_CONFIG_FIELDS: EcoleConfigField[] = [
  { key: 'nom', label: 'Nom officiel' },
  { key: 'type', label: 'Type d\'école' },
  { key: 'institution', label: 'Institution' },
  { key: 'province', label: 'Province administrative' },
  { key: 'provinceEducationnelle', label: 'Province éducationnelle' },
  { key: 'commune', label: 'Commune' },
  { key: 'adresse', label: 'Adresse' },
  { key: 'chefEcole', label: 'Chef d\'établissement' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'coordSousProvincialeId', label: 'Coordination sous-provinciale' },
];

export type EcoleConfigResult = {
  isConfigured: boolean;
  missingFields: EcoleConfigField[];
};

/**
 * Vérifie la configuration d'une école à partir d'un objet partiel.
 * Retourne la liste des champs manquants.
 */
export function checkEcoleConfigured(ecole: Record<string, unknown>): EcoleConfigResult {
  const missingFields = REQUIRED_CONFIG_FIELDS.filter((f) => {
    const val = ecole[f.key];
    return val === null || val === undefined || String(val).trim() === '';
  });
  return {
    isConfigured: missingFields.length === 0,
    missingFields,
  };
}
