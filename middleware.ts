import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify', '/about', '/verifier-bulletin'];

/** Hiérarchie des rôles (doublon de lib/rbac.ts sans dépendance Prisma pour edge). */
const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN: 10,
  COORDINATION_NATIONALE: 9,
  COORDINATION_PROVINCIALE: 8,
  AGENT_PROVINCIAL: 7,
  COORDINATION_SOUS_PROVINCIALE: 6,
  AGENT_SOUS_PROVINCIAL: 5,
  DIRECTION_ECOLE: 4,
  ENSEIGNANT: 3,
  PARENT: 2,
  ELEVE: 1,
};

/** Mapping route → rôle minimum requis. */
const ROUTE_MIN_ROLE: Record<string, string> = {
  '/etablissements': 'DIRECTION_ECOLE',
  '/eleves': 'DIRECTION_ECOLE',
  '/enseignants': 'DIRECTION_ECOLE',
  '/enseignant/dashboard': 'ENSEIGNANT',
  '/cahier-de-notes': 'ENSEIGNANT',
  '/carte-scolaire': 'DIRECTION_ECOLE',
  '/photo-passeport': 'DIRECTION_ECOLE',
  '/cartes-qr': 'DIRECTION_ECOLE',
  '/bulletin-numerique': 'DIRECTION_ECOLE',
  '/dossiers-eleves': 'DIRECTION_ECOLE',
  '/provinces': 'COORDINATION_PROVINCIALE',
  '/ec-erc': 'COORDINATION_PROVINCIALE',
  '/coordination-nationale': 'COORDINATION_NATIONALE',
  '/coordination-provinciale': 'COORDINATION_PROVINCIALE',
  '/coordination-sous-provinciale': 'COORDINATION_SOUS_PROVINCIALE',
  '/admin/users': 'COORDINATION_PROVINCIALE',
  '/bureaux-fonctions': 'COORDINATION_PROVINCIALE',
  '/grades': 'COORDINATION_PROVINCIALE',
  '/dossiers': 'AGENT_PROVINCIAL',
  '/visites': 'AGENT_PROVINCIAL',
  '/services': 'AGENT_SOUS_PROVINCIAL',
  '/admin': 'SUPER_ADMIN',
};

/**
 * Routes réservées à un rôle EXACT (pas de règle de rang) : les espaces propres
 * à un rôle, comme le tableau de bord enseignant, ne doivent pas s'ouvrir aux
 * rôles supérieurs (direction, coordination, administration).
 */
const ROUTE_EXACT_ROLE: Record<string, string> = {
  '/enseignant/dashboard': 'ENSEIGNANT',
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

/** Trouve le rôle exact imposé à un chemin donné (gère les préfixes). */
function getExactRoleForPath(pathname: string): string | undefined {
  const sorted = Object.keys(ROUTE_EXACT_ROLE).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return ROUTE_EXACT_ROLE[route];
    }
  }
  return undefined;
}

/** Trouve le rôle minimum pour un chemin donné (gère les préfixes). */
function getMinRoleForPath(pathname: string): string | undefined {
  // Correspondance exacte d'abord
  if (ROUTE_MIN_ROLE[pathname]) return ROUTE_MIN_ROLE[pathname];
  // Puis par préfixe (ex: /admin/users/xxx → /admin/users)
  const sorted = Object.keys(ROUTE_MIN_ROLE).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return ROUTE_MIN_ROLE[route];
    }
  }
  return undefined;
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
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const requiredRole = getMinRoleForPath(pathname);
    if (requiredRole) {
      const userRank = ROLE_RANK[roleCookie] ?? 0;
      const requiredRank = ROLE_RANK[requiredRole] ?? 0;
      if (userRank < requiredRank) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|school-background|logo|illustrations).*)']
};
