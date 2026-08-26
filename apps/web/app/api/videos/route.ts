import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/videos
 * - Player: their videos.
 * - Admin: todos.
 * - Otros roles: 403.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) return NextResponse.json({ ok: true, videos: [] });
    const videos = await prisma.video.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, videos });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const videos = await prisma.video.findMany({
    include: { player: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, videos });
}

export async function POST() {
  return methodNotAllowed();
}

