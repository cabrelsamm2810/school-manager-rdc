import { NextRequest, NextResponse } from 'next/server';
import { ROLE_RANK } from '@/lib/roles';
import { getExactRoleForPath, getMinRoleForPath } from '@/lib/route-access';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify', '/about', '/verifier-bulletin', '/access-denied'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Les routes API gèrent leur propre authentification.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Vérification du rôle via le cookie (défini à la connexion)
  const roleCookie = request.cookies.get('school_manager_role')?.value;
  if (roleCookie) {
    const exactRole = getExactRoleForPath(pathname);
    if (exactRole && roleCookie !== exactRole) {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    const requiredRole = getMinRoleForPath(pathname);
    if (requiredRole) {
      const userRank = ROLE_RANK[roleCookie] ?? 0;
      const requiredRank = ROLE_RANK[requiredRole] ?? 0;
      if (userRank < requiredRank) {
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|school-background|logo|illustrations|sw.js|manifest.json|offline.html|icon-|apple-touch-icon|favicon-).*)']
};
