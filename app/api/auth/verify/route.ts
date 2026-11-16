import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { readVerification, refreshVerificationWindows, matchesVerificationCode, MAX_VERIFICATION_ATTEMPTS, retrySeconds } from '@/lib/email-verification';

export const runtime = 'nodejs';

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide.'),
  code: z.string().trim().regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres.'),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
    }
    const { email, code } = parsed.data;
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (!user) return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    if (user.isActive) return NextResponse.json({ error: 'Ce compte est déjà validé. Connectez-vous.' }, { status: 400 });
    if (user.userStatus !== 'EN_ATTENTE') {
      return NextResponse.json({ error: 'Ce compte ne peut pas être activé par email. Contactez l’administration.' }, { status: 403 });
    }

    const now = Date.now();
    const stored = readVerification(user.validationCode, user.createdAt);
    if (!stored || stored.expiresAt <= now) {
      return NextResponse.json({ error: 'Ce code a expiré. Demandez un nouveau code.' }, { status: 400 });
    }
    const state = refreshVerificationWindows(stored, now);
    if (state.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      const retryAfter = retrySeconds(state.attemptsResetAt, now);
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } });
    }
    const valid = matchesVerificationCode(state, code);
    const updated = await prisma.user.updateMany({
      where: { id: user.id, isActive: false, userStatus: 'EN_ATTENTE', validationCode: user.validationCode },
      data: valid ? { isActive: true, userStatus: 'ACTIF', validationCode: null }
        : { validationCode: JSON.stringify({ ...state, attempts: state.attempts + 1 }) },
    });
    if (updated.count !== 1) {
      return NextResponse.json({ error: 'Une autre demande a modifié ce code. Réessayez.' }, { status: 409 });
    }
    if (!valid) return NextResponse.json({ error: 'Code de validation incorrect.' }, { status: 400 });
    return NextResponse.json({ ok: true, message: 'Compte validé avec succès.' });
  } catch {
    console.error('[auth/verify] request_failed');
    return NextResponse.json({ error: 'Une erreur est survenue lors de la validation.' }, { status: 500 });
  }
}
