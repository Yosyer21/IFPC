import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/trials — pruebas.
 * - Club: sus pruebas.
 * - Jugador: las suyas.
 * - Admin: todas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (!club) return NextResponse.json({ ok: true, trials: [] });
    const trials = await prisma.trial.findMany({
      where: { clubId: club.id },
      include: { player: { include: { user: true } } },
      orderBy: { startsAt: 'desc' },
    });
    return NextResponse.json({ ok: true, trials });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) return NextResponse.json({ ok: true, trials: [] });
    const trials = await prisma.trial.findMany({
      where: { playerId: player.id },
      include: { club: true },
      orderBy: { startsAt: 'desc' },
    });
    return NextResponse.json({ ok: true, trials });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const trials = await prisma.trial.findMany({
    include: { player: { include: { user: true } }, club: true },
    orderBy: { startsAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, trials });
}

export async function POST() {
  return methodNotAllowed();
}

