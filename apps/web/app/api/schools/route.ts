import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/schools — listado de escuelas y servicios comunitarios. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const schools = await prisma.school.findMany({
    include: { user: true },
    orderBy: { name: 'asc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, schools });
}

export async function POST() {
  return methodNotAllowed();
}
