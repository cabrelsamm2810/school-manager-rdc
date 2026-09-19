import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Identifiants invalides.' },
        { status: 400 }
      );
    }

    const demoHash = '$2a$10$8p6H8Q4oH2XzW1mC8jzW8eT5hK8pL8d9jWvGQ0S3gJt2K8l7D3T6';
    const valid = await verifyPassword(parsed.data.password, demoHash);

    if (!valid) {
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 });
    }

    const sessionToken = randomUUID();
    const response = NextResponse.json({
      ok: true,
      message: 'Connexion réussie.',
      user: {
        email: parsed.data.email,
        role: 'TEACHER'
      }
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    console.error('Login route error', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion.' }, { status: 500 });
  }
}
