import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: 'demo-user-1',
      email: 'schoolmanager@ecole.cd',
      role: 'SCHOOL_DIRECTOR'
    }
  });
}
