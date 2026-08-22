import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/users — lista de usuarios (solo admin). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, users });
}

export async function POST() {
  return methodNotAllowed();
}

