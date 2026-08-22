import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { matchScore } from '@ifpc/matching';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/matching — scores de matching.
 * - Jugador: sus mejores coincidencias con requisitos abiertos.
 * - Club: los mejores jugadores para sus requisitos.
 * - Otros: lista genérica.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const players = await prisma.player.findMany({
    include: { user: true },
    take: 200,
  });
  const requirements = await prisma.requirement.findMany({
    where: { status: 'OPEN' },
    include: { club: true },
    take: 200,
  });

  if (session.user.role === 'PLAYER') {
    const player = players.find((p) => p.userId === session.user.id);
    if (!player) return NextResponse.json({ ok: true, matches: [] });
    const matches = requirements
      .map((requirement) => ({
        requirement,
        score: matchScore(player, requirement).total,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return NextResponse.json({ ok: true, matches });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (!club) return NextResponse.json({ ok: true, matches: [] });
    const clubRequirements = requirements.filter((r) => r.clubId === club.id);
    const matches = players
      .map((player) => {
        const best = clubRequirements
          .map((requirement) => ({ score: matchScore(player, requirement).total, requirement }))
          .sort((a, b) => b.score - a.score)[0];
        return { player, best: best ?? null };
      })
      .filter((m) => m.best !== null)
      .sort((a, b) => (b.best?.score ?? 0) - (a.best?.score ?? 0))
      .slice(0, 10);
    return NextResponse.json({ ok: true, matches });
  }

  // Vista genérica (admin/scout/agente)
  const sample = requirements.slice(0, 10).map((requirement) => {
    const player = players
      .map((p) => ({ player: p, score: matchScore(p, requirement).total }))
      .sort((a, b) => b.score - a.score)[0];
    return { requirement, bestPlayer: player?.player ?? null, score: player?.score ?? 0 };
  });
  return NextResponse.json({ ok: true, matches: sample });
}

export async function POST() {
  return methodNotAllowed();
}

