import { NextResponse } from 'next/server';
import { auth } from '@ifpc/auth';

/** Devuelve la sesión autenticada o `null`. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export function unauthorized(message = 'No autorizado'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = 'Acceso denegado'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function badRequest(message = 'Solicitud no válida'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export function notFound(message = 'No encontrado'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function methodNotAllowed(): NextResponse {
  return NextResponse.json({ ok: false, error: 'Método no permitido' }, { status: 405 });
}

/** Lee el body JSON devolviendo `null` si no es válido. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Devuelve un string limpio del body o `null`. */
export function stringField(
  body: Record<string, unknown>,
  key: string
): string | null {
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Devuelve un número entero del body o `null`. */
export function intField(body: Record<string, unknown>, key: string): number | null {
  const value = body[key];
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Math.trunc(Number(value));
  }
  return null;
}

/** Devuelve una fecha ISO del body o `null`. */
export function dateField(body: Record<string, unknown>, key: string): Date | null {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
