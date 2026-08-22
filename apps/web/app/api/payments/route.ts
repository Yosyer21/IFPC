import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/payments — pagos del usuario autenticado. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, payments });
}

export async function POST() {
  return methodNotAllowed();
}

