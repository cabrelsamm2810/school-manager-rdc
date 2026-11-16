import crypto from 'crypto';

/**
 * Contenu signé des QR codes élèves.
 *
 * Le QR code ne contient AUCUNE donnée personnelle : seulement l'identifiant
 * interne de l'élève, une date d'expiration et une signature HMAC calculée par
 * le serveur. Un code lu par le scanner est donc vérifiable (il vient bien de
 * School Manager RDC) avant toute lecture en base.
 *
 * Format : `SMRDC-ELEVE:<idEleve>:<expirationEpochSecondes>:<signature>`
 */

export const ELEVE_QR_PREFIX = 'SMRDC-ELEVE';

/** Durée de validité par défaut d'une carte scolaire (10 ans). */
const DEFAULT_TTL_DAYS = 3650;

function signingSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ELEVE_QR_SECRET ||
    'school-manager-rdc-eleve-qr-dev'
  );
}

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', signingSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 32);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** Valeur à encoder dans le QR code de la carte scolaire d'un élève. */
export function createEleveQrValue(
  eleveId: string,
  options: { ttlDays?: number } = {},
): string {
  const ttlDays = options.ttlDays ?? DEFAULT_TTL_DAYS;
  const expiresAt = Math.floor(Date.now() / 1000) + ttlDays * 86400;
  const payload = `${ELEVE_QR_PREFIX}:${eleveId}:${expiresAt}`;
  return `${payload}:${sign(payload)}`;
}

/** Le code scanné utilise-t-il le format signé de School Manager RDC ? */
export function isSignedEleveQr(value: string): boolean {
  return value.startsWith(`${ELEVE_QR_PREFIX}:`);
}

export type EleveQrParseResult =
  | { ok: true; eleveId: string }
  | { ok: false; reason: 'invalid' | 'expired' };

/** Vérifie la signature et l'expiration d'un QR code élève signé. */
export function parseEleveQrValue(value: string): EleveQrParseResult {
  const parts = value.split(':');
  if (parts.length !== 4) return { ok: false, reason: 'invalid' };

  const [prefix, eleveId, expiresRaw, signature] = parts;
  if (prefix !== ELEVE_QR_PREFIX || !eleveId || !expiresRaw || !signature) {
    return { ok: false, reason: 'invalid' };
  }

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: 'invalid' };

  if (!safeEqual(signature, sign(`${prefix}:${eleveId}:${expiresRaw}`))) {
    return { ok: false, reason: 'invalid' };
  }

  if (expiresAt * 1000 < Date.now()) return { ok: false, reason: 'expired' };

  return { ok: true, eleveId };
}
