import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(ico|svg|png|jpg|jpeg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Root → serve the static landing page (client-side auth redirect is in app/page.tsx)
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/landing.html', req.url));
  }

  // Everything else passes through — auth is handled client-side via localStorage
  // (Server-side cookie auth will be added in Phase 1 — real auth implementation)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
