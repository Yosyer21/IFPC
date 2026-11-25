import { contactUserSelect } from '@/lib/api/user-select';
import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/parents — cuentas familiares (solo admin; datos de contacto). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const parents = await prisma.parent.findMany({
    include: { user: { select: contactUserSelect } },
    orderBy: { user: { name: 'asc' } },
    take: 100,
  });
  return NextResponse.json({ ok: true, parents });
}

export async function POST() {
  return methodNotAllowed();
}

