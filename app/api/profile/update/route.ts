import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const profileFields = { nom: true, postNom: true, prenom: true, email: true, telephone: true, profilePhotoUrl: true } as const;

export async function PATCH(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  const body = await request.json();
  const user = await prisma.user.update({ where: { id: session }, data: {
    ...(typeof body.nom === 'string' ? { nom: body.nom.trim() } : {}),
    ...(typeof body.postNom === 'string' ? { postNom: body.postNom.trim() } : {}),
    ...(typeof body.prenom === 'string' ? { prenom: body.prenom.trim() } : {}),
    ...(typeof body.email === 'string' ? { email: body.email.trim() } : {}),
    ...(typeof body.telephone === 'string' ? { telephone: body.telephone.trim() } : {})
  }, select: { id: true, role: true, ...profileFields } });
  return NextResponse.json({ ok: true, user });
}
