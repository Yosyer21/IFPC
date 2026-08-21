import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/scouts — listado de ojeadores con sus usuarios. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const scouts = await prisma.scout.findMany({
    include: { user: true },
    orderBy: { user: { name: 'asc' } },
    take: 100,
  });
  return NextResponse.json({ ok: true, scouts });
}

export async function POST() {
  return methodNotAllowed();
}

