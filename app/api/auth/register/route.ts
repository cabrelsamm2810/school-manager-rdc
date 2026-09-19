import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    'SUPER_ADMIN',
    'NATIONAL_COORDINATION',
    'PROVINCIAL_COORDINATION',
    'PROVINCIAL_AGENT',
    'SUB_PROVINCIAL_COORDINATION',
    'SUB_PROVINCIAL_AGENT',
    'SCHOOL_DIRECTOR',
    'TEACHER',
    'PARENT',
    'STUDENT'
  ])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: parsed.error.issues[0]?.message ?? 'Données invalides.'
      }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    return NextResponse.json({
      ok: true,
      message: 'Compte préparé pour création sécurisée.',
      user: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHashLength: passwordHash.length
      }
    });
  } catch (error) {
    console.error('Register route error', error);

    return NextResponse.json({
      error: 'Erreur lors de l’inscription.'
    }, { status: 500 });
  }
}
