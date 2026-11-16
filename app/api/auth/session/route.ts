import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveFileUrl } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { id: session, isActive: true }, include: { ecole: { select: { nom: true } } } });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  const response = NextResponse.json({ authenticated: true, user: {
    id: user.id, nom: user.nom, postNom: user.postNom, prenom: user.prenom,
    email: user.email, telephone: user.telephone, role: user.role, profilePhotoUrl: await resolveFileUrl(user.profilePhotoUrl),
    provinceAdministrative: user.provinceAdministrative,
    ecoleId: user.ecoleId,
    ecoleNom: user.ecole?.nom ?? null,
    typeInstitution: user.typeInstitution,
    institutionName: user.institutionName,
    bureauAffectation: user.bureauAffectation,
    fonction: user.fonction,
    financePermissions: user.financePermissions,
  }});

  // Le rôle vient du compte enregistré : le cookie qui garde les routes est
  // réaligné sur cette valeur à chaque lecture de session.
  if (request.cookies.get('school_manager_role')?.value !== user.role) {
    response.cookies.set('school_manager_role', user.role, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 7),
    });
  }

  return response;
}
