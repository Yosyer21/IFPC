import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/memberships — membresías y pagos del usuario autenticado. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const [membership, payments] = await Promise.all([
    prisma.membership.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);
  return NextResponse.json({ ok: true, membership, payments });
}

export async function POST() {
  return methodNotAllowed();
}

