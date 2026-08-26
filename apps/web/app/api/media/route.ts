import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/media — video listing (alias of `/api/videos`).
 * - Player: their videos.
 * - Admin: todos.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) return NextResponse.json({ ok: true, media: [] });
    const media = await prisma.video.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, media });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const media = await prisma.video.findMany({
    include: { player: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, media });
}

export async function POST() {
  return methodNotAllowed();
}

