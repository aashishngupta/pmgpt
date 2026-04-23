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

  const token = req.cookies.get('pmgpt_access_token')?.value;

  // Root: authenticated → dashboard, unauthenticated → landing page
  if (pathname === '/') {
    if (token) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.rewrite(new URL('/landing.html', req.url));
  }

  // Public paths — always allowed
  if (pathname.startsWith('/login') || pathname.startsWith('/onboarding')) {
    return NextResponse.next();
  }

  // Protected paths — redirect to login if no token
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
    const authHeader = req.headers.get('authorization');
    if (!token && !authHeader) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
