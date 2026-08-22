import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/**
 * GET /api/submissions — envíos de jugadores.
 * - Agente: sus envíos.
 * - Club: envíos a su club.
 * - Admin: todos.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'AGENT') {
    const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
    if (!agent) return NextResponse.json({ ok: true, submissions: [] });
    const submissions = await prisma.submission.findMany({
      where: { agentId: agent.id },
      include: { player: { include: { user: true } }, club: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, submissions });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (!club) return NextResponse.json({ ok: true, submissions: [] });
    const submissions = await prisma.submission.findMany({
      where: { clubId: club.id },
      include: { player: { include: { user: true } }, agent: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, submissions });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const submissions = await prisma.submission.findMany({
    include: {
      player: { include: { user: true } },
      club: true,
      agent: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, submissions });
}

export async function POST() {
  return methodNotAllowed();
}

