import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'school-manager-rdc',
    status: 'healthy',
    environment: process.env.APP_ENV ?? 'development'
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    received: !!body,
    timestamp: new Date().toISOString()
  });
}
