import { NextRequest } from 'next/server';

export async function getSessionUser(request: NextRequest) {
  const sessionCookie = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!sessionCookie) return null;

  return {
    id: 'demo-user-id',
    email: 'demo@ecole.cd',
    role: 'DIRECTION_ECOLE',
    nom: 'School',
    postNom: 'Manager',
    prenom: 'Demo'
  };
}
