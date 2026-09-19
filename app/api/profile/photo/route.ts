import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const uploadProfilePhotoSchema = z.object({
  profilePhotoUrl: z.string().url('URL de photo invalide.')
});

export async function POST(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = uploadProfilePhotoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session },
    data: {
      profilePhotoUrl: parsed.data.profilePhotoUrl
    }
  });

  return NextResponse.json({
    ok: true,
    message: 'Photo de profil mise à jour.',
    user: {
      id: user.id,
      profilePhotoUrl: user.profilePhotoUrl
    }
  });
}
