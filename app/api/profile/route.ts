import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const profileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional()
});

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: 'demo-user-1',
      email: 'schoolmanager@ecole.cd',
      firstName: 'School',
      lastName: 'Manager',
      role: 'SCHOOL_DIRECTOR'
    }
  });
}

export async function PATCH(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Profil mis à jour.',
      profile: parsed.data
    });
  } catch (error) {
    console.error('Profile update error', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil.' }, { status: 500 });
  }
}
