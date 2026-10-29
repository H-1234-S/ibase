import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'ibase_at';
const REFRESH_COOKIE = 'ibase_rt';
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/service-unavailable',
]);

/** Protects app routes and refreshes expired sessions before rendering pages. */
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/$/, '') || '/';
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }
  if (pathname === '/service-unavailable') {
    return NextResponse.next();
  }

  const isInvitationPath = pathname.startsWith('/invitations/');
  const isPublicPath = PUBLIC_PATHS.has(pathname) || isInvitationPath;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';
  let authenticated = false;
  let refreshedCookies: string[] = [];

  try {
    if (accessToken) {
      const response = await fetch(new URL('/api/auth/me', apiBaseUrl), {
        headers: { cookie: tokenCookieHeader(accessToken) },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      authenticated = response.ok;
    }

    if (!authenticated && refreshToken) {
      const response = await fetch(new URL('/api/auth/refresh', apiBaseUrl), {
        method: 'POST',
        headers: {
          cookie: tokenCookieHeader(accessToken, refreshToken),
          origin: request.nextUrl.origin,
          'x-ibase-request': '1',
        },
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      });
      refreshedCookies = response.headers.getSetCookie();
      authenticated = response.ok;
    }
  } catch {
    if (pathname === '/') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/service-unavailable', request.url), {
      status: 307,
    });
  }

  if (PUBLIC_PATHS.has(pathname) && authenticated) {
    const nextPath = request.nextUrl.searchParams.get('next');
    const redirectPath =
      (pathname === '/login' || pathname === '/register') &&
      nextPath?.startsWith('/invitations/') &&
      !nextPath.startsWith('//')
        ? nextPath
        : '/dashboard';
    return withCookies(
      NextResponse.redirect(new URL(redirectPath, request.url)),
      refreshedCookies,
    );
  }

  if (!isPublicPath && !authenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return withCookies(NextResponse.redirect(loginUrl), refreshedCookies);
  }

  const response = NextResponse.next();
  if (isInvitationPath) {
    response.headers.set('Referrer-Policy', 'no-referrer');
  }
  return withCookies(response, refreshedCookies);
}

function tokenCookieHeader(accessToken?: string, refreshToken?: string) {
  return [
    accessToken && `${ACCESS_COOKIE}=${accessToken}`,
    refreshToken && `${REFRESH_COOKIE}=${refreshToken}`,
  ]
    .filter(Boolean)
    .join('; ');
}

function withCookies(response: NextResponse, cookies: string[]) {
  for (const cookie of cookies) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
