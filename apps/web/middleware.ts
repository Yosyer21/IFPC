import {
  canAccessDashboard,
  getToken,
  isRole,
  ROLE_DASHBOARD_PREFIXES,
} from '@ifpc/auth/edge';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Guard por rol. La regla vive en `@ifpc/auth` (una sola fuente de verdad,
  // cubierta por tests): /dashboard/<rol> solo para ese rol, `/dashboard` y las
  // áreas compartidas (p. ej. /dashboard/discovery) para cualquier sesión.
  if (pathname !== '/dashboard') {
    const role = typeof token.role === 'string' ? token.role.toUpperCase() : '';
    if (!isRole(role)) {
      // Token sin rol reconocible: se falla cerrado en vez de abrir el área.
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!canAccessDashboard(role, pathname)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD_PREFIXES[role], request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
