import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { id: session, isActive: true }, include: { ecole: { select: { nom: true } } } });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user: {
    id: user.id, nom: user.nom, postNom: user.postNom, prenom: user.prenom,
    email: user.email, telephone: user.telephone, role: user.role, profilePhotoUrl: user.profilePhotoUrl,
    provinceAdministrative: user.provinceAdministrative,
    ecoleId: user.ecoleId,
    ecoleNom: user.ecole?.nom ?? null,
    typeInstitution: user.typeInstitution,
    institutionName: user.institutionName,
    bureauAffectation: user.bureauAffectation,
    fonction: user.fonction,
  }});
}
