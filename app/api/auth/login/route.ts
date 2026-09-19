import { NextRequest, NextResponse } from 'next/server';
import { loginUser, createSessionCookieResponse } from '@/lib/account-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await loginUser(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      message: 'Connexion réussie.',
      user: {
        id: result.user.id,
        email: result.user.email,
        nom: result.user.nom,
        prenom: result.user.prenom,
        role: result.user.role
      }
    });

    return createSessionCookieResponse(response, result.user.id);
  } catch (error) {
    return NextResponse.json({ error: 'Une erreur est survenue lors de la connexion.' }, { status: 500 });
  }
}
