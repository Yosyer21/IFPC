import {
  canAccessDashboard,
  getToken,
  isRole,
  isSecureRequest,
  ROLE_DASHBOARD_PREFIXES,
} from '@ifpc/auth/edge';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // El endpoint de credenciales de Auth.js se puede llamar directamente sin pasar
  // por `loginAction`; se limita por IP para que el rate limit no sea decorativo.
  if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const limited = rateLimit(`auth-callback:${ip}`, 20, 60_000);
    if (!limited.ok) {
      return new NextResponse('Too many attempts', {
        status: 429,
        headers: { 'Retry-After': String(limited.retryAfterSeconds) },
      });
    }
  }

  // CSRF en rutas API: las mutaciones con cookie no pasan por la protección de
  // las server actions. Se compara `Origin` con `Host`; los webhooks y clientes
  // sin navegador (sin `Origin`) siguen funcionando.
  if (pathname.startsWith('/api') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (origin) {
      const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
      let sameOrigin = false;
      try {
        sameOrigin = Boolean(host) && new URL(origin).host === host;
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) {
        return NextResponse.json(
          { ok: false, error: 'Cross-site request blocked' },
          { status: 403 }
        );
      }
    }
  }

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // `getToken` asume por defecto la cookie de sesión NO segura, pero en HTTPS
  // Auth.js la emite como `__Secure-authjs.session-token` y usa su nombre como
  // `salt` del JWT: sin indicarlo aquí el token no se descifra y todo el
  // dashboard redirige a /login.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecureRequest(request.headers, request.nextUrl.protocol),
  });

  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Token sin id (usuario borrado o sesión manipulada): se falla cerrado.
  if (typeof token.id !== 'string' || !token.id) {
    return NextResponse.redirect(new URL('/login', request.url));
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
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
