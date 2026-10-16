import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/account-service';

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
    return NextResponse.json({ error: 'Une erreur est survenue lors de l\u2019inscription.' }, { status: 500 });
  }
}
