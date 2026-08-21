import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/documents
 * - Jugador: sus documentos.
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
    if (!player) return NextResponse.json({ ok: true, documents: [] });
    const documents = await prisma.document.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, documents });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const documents = await prisma.document.findMany({
    include: { player: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, documents });
}

export async function POST() {
  return methodNotAllowed();
}

