import 'server-only';

import { randomInt, timingSafeEqual } from 'crypto';
import { z } from 'zod';

export const CODE_TTL_MS = 15 * 60_000;
export const RESEND_COOLDOWN_MS = 60_000;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_VERIFICATION_ATTEMPTS = 5;

// État versionné dans le champ TEXT validationCode existant : aucune migration
// ni réécriture des comptes historiques. Ce champ reste exclusivement serveur.
const stateSchema = z.object({
  version: z.literal(1), code: z.string().regex(/^\d{6}$/),
  expiresAt: z.number().int().nonnegative(),
  attempts: z.number().int().nonnegative(), attemptsResetAt: z.number().int().nonnegative(),
  sends: z.number().int().nonnegative(), sendWindowEndsAt: z.number().int().nonnegative(),
  resendAfter: z.number().int().nonnegative(),
});
export type VerificationState = z.infer<typeof stateSchema>;

export function createVerification(now = Date.now()): VerificationState {
  return {
    version: 1, code: randomInt(100000, 1000000).toString(), expiresAt: now + CODE_TTL_MS,
    attempts: 0, attemptsResetAt: now + CODE_TTL_MS,
    sends: 0, sendWindowEndsAt: now + 60 * 60_000, resendAfter: 0,
  };
}

export function readVerification(value: string | null, createdAt: Date): VerificationState | null {
  if (!value) return null;
  if (/^\d{6}$/.test(value)) {
    // Un ancien code n'obtient pas une nouvelle durée de vie à chaque lecture.
    const issuedAt = new Date(createdAt).getTime();
    if (!Number.isFinite(issuedAt)) return null;
    return {
      version: 1, code: value, expiresAt: issuedAt + CODE_TTL_MS,
      attempts: 0, attemptsResetAt: issuedAt + CODE_TTL_MS,
      sends: 0, sendWindowEndsAt: issuedAt + 60 * 60_000, resendAfter: 0,
    };
  }
  try {
    const parsed = stateSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

export function refreshVerificationWindows(state: VerificationState, now: number): VerificationState {
  return {
    ...state,
    ...(now >= state.attemptsResetAt ? { attempts: 0, attemptsResetAt: now + CODE_TTL_MS } : {}),
    ...(now >= state.sendWindowEndsAt ? { sends: 0, sendWindowEndsAt: now + 60 * 60_000 } : {}),
  };
}

export function reserveVerificationSend(state: VerificationState, now = Date.now()): VerificationState {
  return { ...state, sends: state.sends + 1, resendAfter: now + RESEND_COOLDOWN_MS };
}

export function matchesVerificationCode(state: VerificationState, code: string): boolean {
  return /^\d{6}$/.test(code) && timingSafeEqual(Buffer.from(state.code), Buffer.from(code));
}

export function retrySeconds(until: number, now: number) {
  return Math.max(1, Math.ceil((until - now) / 1000));
}
