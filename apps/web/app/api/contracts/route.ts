import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/contracts — contratos (club: suyos; admin: todos). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (!club) return NextResponse.json({ ok: true, contracts: [] });
    const contracts = await prisma.contract.findMany({
      where: { clubId: club.id },
      include: { player: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, contracts });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const contracts = await prisma.contract.findMany({
    include: { player: { include: { user: true } }, club: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, contracts });
}

export async function POST() {
  return methodNotAllowed();
}

