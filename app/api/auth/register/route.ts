import { NextRequest, NextResponse } from 'next/server';
import { loginUser, registerUser } from '@/lib/account-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerUser(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: result.user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Une erreur est survenue lors de l’inscription.' }, { status: 500 });
  }
}
