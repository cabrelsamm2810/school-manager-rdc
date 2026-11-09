import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/account-service';

// Vercel serverless : autoriser suffisamment de temps pour l'envoi SMTP
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerUser(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { passwordHash, validationCode, ...safeUser } = result.user;
    return NextResponse.json({ ok: true, user: safeUser, verificationEmailSent: result.verificationEmailSent }, { status: 201 });
  } catch (error) {
    // Ni données personnelles ni mot de passe dans les journaux : seulement de quoi identifier la panne.
    console.error('[auth] register_failed', { name: (error as Error)?.name, code: (error as { code?: string })?.code });
    return NextResponse.json({ error: 'Une erreur est survenue lors de l\u2019inscription.' }, { status: 500 });
  }
}
