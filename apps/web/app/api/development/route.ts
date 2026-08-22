import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/development — desarrollo del jugador (ruta, objetivos, evaluaciones).
 * - Jugador: su desarrollo.
 * - Coach: de sus jugadores.
 * - Admin: de todos (sin incluir relación).
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: {
        pathway: true,
        goals: { orderBy: { createdAt: 'desc' } },
        evaluations: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!player) return NextResponse.json({ ok: true, development: null });
    return NextResponse.json({ ok: true, development: player });
  }

  if (session.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
      include: {
        players: { include: { player: { include: { pathway: true, goals: true } } } },
      },
    });
    if (!coach) return NextResponse.json({ ok: true, development: [] });
    return NextResponse.json({
      ok: true,
      development: coach.players.map((p) => p.player),
    });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const players = await prisma.player.findMany({
    include: { pathway: true, goals: true, evaluations: true },
    take: 200,
  });
  return NextResponse.json({ ok: true, development: players });
}

export async function POST() {
  return methodNotAllowed();
}

