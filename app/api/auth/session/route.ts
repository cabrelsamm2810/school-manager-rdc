import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/profile', '/schoolchat', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session')?.value;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/schoolchat/:path*', '/settings/:path*']
};
