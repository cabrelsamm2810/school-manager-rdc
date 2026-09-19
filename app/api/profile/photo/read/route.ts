import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, message: 'Photo de profil accessible.' });
}
