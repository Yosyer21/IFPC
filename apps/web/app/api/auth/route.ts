import { NextResponse } from 'next/server';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/auth — current session information.
 * El flujo de login/register vive en Auth.js (`/api/auth/[...nextauth]`).
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, authenticated: true, user: session.user });
}

export async function POST() {
  return methodNotAllowed();
}

