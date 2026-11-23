import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  ELEVE_QR_KIND,
  ELEVE_QR_SIGNATURE_LENGTH,
  ELEVE_QR_VERSION,
  buildEleveQrValue,
} from '@/lib/qr-eleve';

/**
 * Signature des QR Codes « carte scolaire ».
 *
 * Clé : `QR_SIGNING_SECRET` (recommandée en production), repli sur
 * `SESSION_SECRET`, puis sur une constante de développement pour que les cartes
 * générées en local restent lisibles. Changer la clé invalide les cartes déjà
 * imprimées : la faire tourner uniquement lors d'une réédition des cartes.
 */
const DEV_FALLBACK_SECRET = 'smrdc-eleve-carte-qr-dev-v1';

function secret(): string {
  return (
    process.env.QR_SIGNING_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    DEV_FALLBACK_SECRET
  );
}

/** Chaîne signée : le type et la version sont couverts par la signature. */
function signedMessage(matricule: string): string {
  return `${ELEVE_QR_KIND}:${ELEVE_QR_VERSION}:${matricule}`;
}

/** Signature HMAC-SHA256 tronquée (16 caractères hexadécimaux). */
export function signEleveMatricule(matricule: string): string {
  return createHmac('sha256', secret())
    .update(signedMessage(matricule))
    .digest('hex')
    .slice(0, ELEVE_QR_SIGNATURE_LENGTH);
}

/** Valeur complète à encoder dans le QR Code de la carte scolaire. */
export function buildSignedEleveQr(matricule: string): string {
  return buildEleveQrValue(matricule, signEleveMatricule(matricule));
}

/** Comparaison à temps constant pour éviter de fuiter la signature attendue. */
export function verifyEleveQrSignature(matricule: string, signature: string): boolean {
  const expected = Buffer.from(signEleveMatricule(matricule), 'utf8');
  const received = Buffer.from(signature.toLowerCase(), 'utf8');
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
