import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/evaluations
 * - Jugador: sus evaluaciones.
 * - Coach: evaluaciones de sus jugadores.
 * - Admin: todas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) return NextResponse.json({ ok: true, evaluations: [] });
    const evaluations = await prisma.evaluation.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, evaluations });
  }

  if (session.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
      include: { players: { select: { playerId: true } } },
    });
    if (!coach) return NextResponse.json({ ok: true, evaluations: [] });
    const playerIds = coach.players.map((p) => p.playerId);
    const evaluations = await prisma.evaluation.findMany({
      where: { playerId: { in: playerIds } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ ok: true, evaluations });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const evaluations = await prisma.evaluation.findMany({
    include: { player: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, evaluations });
}

export async function POST() {
  return methodNotAllowed();
}

