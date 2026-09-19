import { NextRequest, NextResponse } from 'next/server';

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  nom: string;
  postNom?: string | null;
  prenom: string;
};

export async function getAuthenticatedUser(request: NextRequest): Promise<SessionUser | null> {
  const cookie = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!cookie) return null;

  return {
    id: 'demo-user-id',
    email: 'demo@ecole.cd',
    role: 'DIRECTION_ECOLE',
    nom: 'Manager',
    postNom: 'School',
    prenom: 'Demo'
  };
}

export function requireAuth() {
  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
}
