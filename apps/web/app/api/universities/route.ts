import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/universities — listado de universities. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const universities = await prisma.university.findMany({
    include: { user: true },
    orderBy: { name: 'asc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, universities });
}

export async function POST() {
  return methodNotAllowed();
}

