import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendValidationCode } from '@/lib/mail';
import { MailDeliveryError } from '@/lib/smtp';
import {
  createVerification, readVerification, refreshVerificationWindows, reserveVerificationSend,
  MAX_SENDS_PER_HOUR, retrySeconds,
} from '@/lib/email-verification';

export const runtime = 'nodejs';
export const maxDuration = 60;

const resendSchema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: NextRequest) {
  try {
    const parsed = resendSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { email: { equals: parsed.data.email, mode: 'insensitive' } } });
    if (!user) return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    if (user.isActive) return NextResponse.json({ error: 'Ce compte est déjà validé. Connectez-vous.' }, { status: 400 });
    if (user.userStatus !== 'EN_ATTENTE') {
      return NextResponse.json({ error: 'Ce compte ne peut pas être activé par email. Contactez l’administration.' }, { status: 403 });
    }

    const now = Date.now();
    const previous = readVerification(user.validationCode, user.createdAt);
    let state = refreshVerificationWindows(previous || createVerification(now), now);
    const retryAt = Math.max(state.resendAfter, state.sends >= MAX_SENDS_PER_HOUR ? state.sendWindowEndsAt : 0);
    if (retryAt > now) {
      const retryAfter = retrySeconds(retryAt, now);
      return NextResponse.json({ error: `Veuillez patienter ${retryAfter} secondes avant de renvoyer le code.`, retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } });
    }
    // Conserver un code encore valable, même après un échec SMTP. Un nouveau
    // code n'est généré qu'après expiration, sans réinitialiser les compteurs.
    if (state.expiresAt <= now) {
      const fresh = createVerification(now);
      state = { ...state, code: fresh.code, expiresAt: fresh.expiresAt };
    }
    state = reserveVerificationSend(state, now);

    // Compare-and-swap en base : un seul gagnant entre plusieurs instances
    // Vercel. Aucun verrou en mémoire et aucune transaction ouverte sur SMTP.
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, isActive: false, userStatus: 'EN_ATTENTE', validationCode: user.validationCode },
      data: { validationCode: JSON.stringify(state) },
    });
    if (claimed.count !== 1) {
      return NextResponse.json({ error: 'Une demande est déjà en cours. Réessayez dans une minute.' },
        { status: 429, headers: { 'Retry-After': '60' } });
    }

    try {
      await sendValidationCode(user.email, state.code, user.prenom);
    } catch (error) {
      return NextResponse.json({
        error: 'Le service d’envoi est indisponible. Aucun code encore valable n’a été remplacé. Réessayez dans une minute.',
        reference: error instanceof MailDeliveryError ? error.reference : undefined,
      }, { status: 503, headers: { 'Retry-After': '60' } });
    }
    return NextResponse.json({ ok: true, message: 'Le code de validation a été renvoyé.', expiresIn: Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000)) });
  } catch {
    console.error('[auth/resend] request_failed');
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
