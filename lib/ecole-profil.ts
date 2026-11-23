/**
 * Profil École — définitions partagées (serveur + client).
 *
 * Module pur : aucun accès à Prisma ni à `node:crypto`, pour être importable
 * par les routes API comme par les composants clients.
 *
 * QR Code d'établissement (version 1) :
 *   SMRDC:ECOLE:1:<codeEcole>:<qrToken>
 *
 * Le QR ne contient aucune donnée personnelle : le code école (public) et le
 * jeton propre à l'école (secret, révocable). Les informations administratives
 * sont toujours relues en base, jamais lues dans le QR.
 */

export const ECOLE_QR_PREFIX = 'SMRDC';
export const ECOLE_QR_KIND = 'ECOLE';
export const ECOLE_QR_VERSION = '1';
/** Longueur du jeton stocké dans le QR (hexadécimal). */
export const ECOLE_QR_TOKEN_LENGTH = 24;

const TOKEN_PATTERN = new RegExp(`^[a-f0-9]{${ECOLE_QR_TOKEN_LENGTH}}$`);
const CODE_ECOLE_PATTERN = /^ECO-[A-Z]{3}-\d{2}-\d{6}$/;

/** Champs administratifs modifiables depuis la fiche « Profil École ». */
export type EcoleProfilChamp = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea';
  required?: boolean;
};

export const ECOLE_PROFIL_CHAMPS: EcoleProfilChamp[] = [
  { key: 'nom', label: 'Nom officiel', type: 'text', required: true },
  { key: 'type', label: "Type d'établissement", type: 'text' },
  { key: 'dinacope', label: 'DINACOPE', type: 'text' },
  { key: 'province', label: 'Province administrative', type: 'text' },
  { key: 'provinceEducationnelle', label: 'Province éducationnelle', type: 'text' },
  { key: 'ville', label: 'Ville', type: 'text' },
  { key: 'commune', label: 'Commune', type: 'text' },
  { key: 'adresse', label: 'Adresse', type: 'textarea' },
  { key: 'telephone', label: 'Téléphone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'chefEcole', label: "Chef d'établissement (nom affiché)", type: 'text' },
  { key: 'effectif', label: 'Effectif', type: 'number' },
  { key: 'logoUrl', label: 'Logo (URL)', type: 'text' },
];

export const ECOLE_PROFIL_CHAMP_LABELS: Record<string, string> = Object.fromEntries(
  ECOLE_PROFIL_CHAMPS.map((c) => [c.key, c.label]),
);

/** Libellés lisibles des actions de l'historique. */
export const ECOLE_HISTORIQUE_ACTIONS: Record<string, string> = {
  CREATION: 'Création du profil',
  MODIFICATION: 'Modification',
  CHEF_ASSOCIE: 'Chef d\u2019établissement associé',
  CHEF_DISSOCIE: 'Chef d\u2019établissement dissocié',
  SECTION_AJOUT: 'Section / option ajoutée',
  SECTION_MODIFICATION: 'Section / option modifiée',
  SECTION_SUPPRESSION: 'Section / option supprimée',
  QR_REGENERATION: 'QR Code régénéré',
};

export const ECOLE_SECTION_TYPES = ['Section', 'Option'] as const;

/**
 * Code école public, généré automatiquement : `ECO-<INST>-<AA>-<6 chiffres>`.
 * Exemple : `ECO-ERC-26-481920`.
 */
export function generateCodeEcole(institution: string): string {
  const parts = (institution || 'ECO').split(/[^A-Za-z]+/).filter(Boolean);
  const prefix = (parts[parts.length - 1] || 'ECO').slice(0, 3).toUpperCase().padEnd(3, 'X');
  const year = String(new Date().getFullYear()).slice(-2);
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ECO-${prefix}-${year}-${random}`;
}

export function isCodeEcole(value: string): boolean {
  return CODE_ECOLE_PATTERN.test(value);
}

/** Valeur complète à encoder dans le QR Code de l'établissement. */
export function buildEcoleQrValue(codeEcole: string, qrToken: string): string {
  return [ECOLE_QR_PREFIX, ECOLE_QR_KIND, ECOLE_QR_VERSION, codeEcole, qrToken].join(':');
}

export type ParsedEcoleQr =
  | { ok: true; codeEcole: string; qrToken: string }
  | { ok: false; reason: 'empty' | 'format' | 'version' };

/** Analyse la valeur lue par une caméra (contrôle de forme uniquement). */
export function parseEcoleQrValue(raw: string | null | undefined): ParsedEcoleQr {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'empty' };
  if (!value.startsWith(`${ECOLE_QR_PREFIX}:`)) return { ok: false, reason: 'format' };

  const parts = value.split(':');
  if (parts.length !== 5) return { ok: false, reason: 'format' };
  const [, kind, version, codeEcole, qrToken] = parts;
  if (kind !== ECOLE_QR_KIND || !isCodeEcole(codeEcole)) return { ok: false, reason: 'format' };
  if (version !== ECOLE_QR_VERSION) return { ok: false, reason: 'version' };
  if (!TOKEN_PATTERN.test(qrToken)) return { ok: false, reason: 'format' };

  return { ok: true, codeEcole, qrToken };
}
