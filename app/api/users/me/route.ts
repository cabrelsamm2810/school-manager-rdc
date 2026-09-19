import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      nom: user.nom,
      postNom: user.postNom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      profilePhotoUrl: user.profilePhotoUrl
    }
  });
}
