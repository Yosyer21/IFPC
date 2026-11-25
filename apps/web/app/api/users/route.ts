import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';
import { adminUserSelect } from '@/lib/api/user-select';

/** GET /api/users — lista de usuarios (solo admin, sin hash de contraseña). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const users = await prisma.user.findMany({
    select: adminUserSelect,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, users });
}

export async function POST() {
  return methodNotAllowed();
}

