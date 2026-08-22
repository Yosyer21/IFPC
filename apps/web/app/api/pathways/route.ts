import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/pathways
 * - Jugador: su ruta.
 * - Parent: rutas de sus hijos.
 * - Admin: todas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: { pathway: true, goals: true },
    });
    if (!player) return NextResponse.json({ ok: true, pathways: [] });
    return NextResponse.json({
      ok: true,
      pathways: player.pathway ? [player.pathway] : [],
      goals: player.goals,
    });
  }

  if (session.user.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { children: { include: { player: { include: { pathway: true } } } } },
    });
    if (!parent) return NextResponse.json({ ok: true, pathways: [] });
    return NextResponse.json({
      ok: true,
      pathways: parent.children.map((c) => c.player.pathway).filter(Boolean),
    });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const pathways = await prisma.pathway.findMany({ take: 200 });
  return NextResponse.json({ ok: true, pathways });
}

export async function POST() {
  return methodNotAllowed();
}

