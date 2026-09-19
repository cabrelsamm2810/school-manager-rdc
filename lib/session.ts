import { NextRequest } from 'next/server';

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

export function getSessionUser(request: NextRequest): SessionUser | null {
  const session = request.cookies.get('session')?.value;

  if (!session) return null;

  return {
    id: 'demo-user-1',
    email: 'schoolmanager@ecole.cd',
    role: 'SCHOOL_DIRECTOR'
  };
}
