import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/onboarding'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and API routes
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p)) ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Protect /dashboard and /settings
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
    const token = req.cookies.get('pmgpt_access_token')?.value;
    // Also check Authorization header for API calls
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
