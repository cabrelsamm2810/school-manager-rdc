/**
 * Format du QR Code « carte scolaire » de School Manager RDC.
 *
 * Le QR Code ne contient AUCUNE donnée personnelle : uniquement le matricule
 * (identifiant unique de l'élève) et une signature HMAC calculée par le serveur
 * (`lib/qr-eleve-sign.ts`). La signature prouve que l'étiquette a bien été
 * émise par School Manager RDC ; les données de l'élève sont toujours relues
 * en base, jamais lues dans le QR.
 *
 * Format signé (version 1) :
 *   SMRDC:ELEVE:1:<matricule>:<signature>
 *
 * Ce module est volontairement pur (aucun accès à `node:crypto`) : il est
 * partagé par les routes serveur et par les composants clients qui doivent
 * reconnaître le format (saisie manuelle, mode hors connexion).
 */

export const ELEVE_QR_PREFIX = 'SMRDC';
export const ELEVE_QR_KIND = 'ELEVE';
export const ELEVE_QR_VERSION = '1';
/** Longueur (en caractères hexadécimaux) de la signature tronquée HMAC-SHA256. */
export const ELEVE_QR_SIGNATURE_LENGTH = 16;

const SIGNATURE_PATTERN = /^[a-f0-9]{16}$/;
/** Un matricule : lettres/chiffres, puis lettres/chiffres et . _ / - (40 caractères max). */
const MATRICULE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,39}$/;

export type EleveQrFormat = 'signed' | 'legacy';

export type ParsedEleveQr =
  | { ok: true; matricule: string; format: EleveQrFormat; signature?: string }
  | { ok: false; reason: 'empty' | 'format' | 'version' | 'signature' };

/** true si la valeur peut être un matricule (aucun caractère exotique). */
export function looksLikeMatricule(value: string): boolean {
  return MATRICULE_PATTERN.test(value);
}

/** Assemble la valeur encodée dans le QR Code signé. */
export function buildEleveQrValue(matricule: string, signature: string): string {
  return [
    ELEVE_QR_PREFIX,
    ELEVE_QR_KIND,
    ELEVE_QR_VERSION,
    matricule,
    signature,
  ].join(':');
}

/**
 * Analyse la valeur lue par la caméra.
 *
 * - `signed`   : format School Manager RDC versionné → la signature doit être
 *                vérifiée côté serveur avant toute lecture en base.
 * - `legacy`   : anciennes cartes (matricule seul, ou URL avec `?matricule=`).
 *                Acceptées pour ne pas invalider les étiquettes déjà imprimées ;
 *                elles restent soumises à l'authentification et au périmètre.
 */
export function parseEleveQrValue(raw: string | null | undefined): ParsedEleveQr {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'empty' };

  if (value.startsWith(`${ELEVE_QR_PREFIX}:`)) {
    const parts = value.split(':');
    if (parts.length !== 5) return { ok: false, reason: 'format' };
    const [, kind, version, matricule, signature] = parts;
    if (kind !== ELEVE_QR_KIND || !looksLikeMatricule(matricule)) {
      return { ok: false, reason: 'format' };
    }
    if (version !== ELEVE_QR_VERSION) return { ok: false, reason: 'version' };
    if (!SIGNATURE_PATTERN.test(signature)) return { ok: false, reason: 'format' };
    return { ok: true, matricule, format: 'signed', signature };
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const candidat = url.searchParams.get('matricule') ?? url.searchParams.get('id') ?? '';
      if (looksLikeMatricule(candidat)) {
        return { ok: true, matricule: candidat, format: 'legacy' };
      }
    } catch {
      // URL malformée → format inconnu
    }
    return { ok: false, reason: 'format' };
  }

  if (looksLikeMatricule(value)) {
    return { ok: true, matricule: value, format: 'legacy' };
  }

  return { ok: false, reason: 'format' };
}

/** Matricule contenu dans une valeur de QR (utile au mode hors connexion). */
export function extractEleveMatricule(raw: string | null | undefined): string | null {
  const parsed = parseEleveQrValue(raw);
  return parsed.ok ? parsed.matricule : null;
}
