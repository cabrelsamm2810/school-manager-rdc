import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { id: session, isActive: true }, select: { id: true, nom: true, postNom: true, prenom: true, email: true, telephone: true, role: true, profilePhotoUrl: true } });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user });
}
