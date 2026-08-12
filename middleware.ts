import { NextRequest, NextResponse } from 'next/server';

// Routes that require a participant session (localStorage checked client-side)
// Middleware here handles cookie-based fallback and prevents direct URL access
const PARTICIPANT_ROUTES = ['/bingo', '/rank', '/rewards'];
const OPERATOR_ROUTES = ['/admin/setup', '/admin/grid-config', '/admin/launch', '/admin/dashboard', '/admin/rewards-config', '/admin/task-details', '/admin/branding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check participant session cookie (set by lobby page on join)
  const participantSession = request.cookies.get('hb_session');
  const operatorSession = request.cookies.get('hb_operator');

  // Protect participant game routes
  if (PARTICIPANT_ROUTES.some(r => pathname.startsWith(r))) {
    if (!participantSession?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/join';
      url.searchParams.set('reason', 'no_session');
      return NextResponse.redirect(url);
    }
  }

  // Protect operator routes
  if (OPERATOR_ROUTES.some(r => pathname.startsWith(r))) {
    if (!operatorSession?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('reason', 'no_session');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/bingo/:path*',
    '/rank/:path*',
    '/rewards/:path*',
    '/lobby/:path*',
    '/admin/setup/:path*',
    '/admin/grid-config/:path*',
    '/admin/launch/:path*',
    '/admin/dashboard/:path*',
    '/admin/rewards-config/:path*',
    '/admin/task-details/:path*',
    '/admin/branding/:path*',
  ],
};
