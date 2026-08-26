import { NextResponse } from 'next/server';
import { auth } from '@ifpc/auth';

/** Returns the authenticated session or `null`. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = 'Access denied'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function badRequest(message = 'Invalid request'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function methodNotAllowed(): NextResponse {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
}

/** Reads the JSON body, returning `null` if it is not valid. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Returns a trimmed string from the body or `null`. */
export function stringField(
  body: Record<string, unknown>,
  key: string
): string | null {
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Returns an integer from the body or `null`. */
export function intField(body: Record<string, unknown>, key: string): number | null {
  const value = body[key];
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Math.trunc(Number(value));
  }
  return null;
}

/** Returns an ISO date from the body or `null`. */
export function dateField(body: Record<string, unknown>, key: string): Date | null {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
