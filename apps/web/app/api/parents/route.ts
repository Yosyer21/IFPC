import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/parents — listado de cuentas familiares con sus usuarios. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const parents = await prisma.parent.findMany({
    include: { user: true },
    orderBy: { user: { name: 'asc' } },
    take: 100,
  });
  return NextResponse.json({ ok: true, parents });
}

export async function POST() {
  return methodNotAllowed();
}

