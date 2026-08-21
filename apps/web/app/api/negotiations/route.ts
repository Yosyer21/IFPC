import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/negotiations — negociaciones (club: suyas; admin: todas). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (!club) return NextResponse.json({ ok: true, negotiations: [] });
    const negotiations = await prisma.negotiation.findMany({
      where: { clubId: club.id },
      include: { player: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, negotiations });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const negotiations = await prisma.negotiation.findMany({
    include: { player: { include: { user: true } }, club: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, negotiations });
}

export async function POST() {
  return methodNotAllowed();
}

