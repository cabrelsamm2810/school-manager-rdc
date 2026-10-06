import { NextRequest, NextResponse } from 'next/server';
import { loginUser, createSessionCookieResponse } from '@/lib/account-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await loginUser(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const user = result.user;
    if (!user) {
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      message: 'Connexion réussie.',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });

    return createSessionCookieResponse(response, user.id, user.role);
  } catch (error) {
    return NextResponse.json({ error: 'Une erreur est survenue lors de la connexion.' }, { status: 500 });
  }
}
