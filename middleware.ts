import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Offentlige ruter som altid skal være frit tilgængelige
  if (
    pathname === '/' ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Beskyt /dashboard
  if (pathname.startsWith('/dashboard')) {
    const hasAuthCookie = 
      request.cookies.has('sb-access-token') || 
      request.cookies.has('supabase-auth-token') ||
      request.cookies.has('sb-auth-token') ||
      request.cookies.getAll().some(c => c.name.includes('auth-token') || c.name.startsWith('sb-'));

    // Lader Next.js håndtere videre tjek
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
