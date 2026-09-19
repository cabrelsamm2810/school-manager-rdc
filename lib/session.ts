import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  });
}
