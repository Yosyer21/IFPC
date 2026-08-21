import { getToken } from '@future-buller/auth/edge';
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

  // Guard por rol: /dashboard/<rol> solo para ese rol.
  if (pathname !== '/dashboard') {
    const role = (token.role as string | undefined)?.toLowerCase();
    const rolePrefix = role ? `/dashboard/${role}` : null;
    if (rolePrefix && !pathname.startsWith(rolePrefix)) {
      return NextResponse.redirect(new URL(rolePrefix, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
