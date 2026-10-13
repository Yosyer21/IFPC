import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import {
  requireUser,
  forbidden,
  badRequest,
  readJson,
  stringField,
} from '@/lib/api/respond';

/**
 * GET /api/applications
 * - Player: sus requests.
 * - Club: requests recibidas en sus opportunities.
 * - Admin: todas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) return NextResponse.json({ ok: true, applications: [] });
    const applications = await prisma.application.findMany({
      where: { playerId: player.id },
      include: { opportunity: { include: { club: true, university: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, applications });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (!club) return NextResponse.json({ ok: true, applications: [] });
    const applications = await prisma.application.findMany({
      where: { opportunity: { clubId: club.id } },
      include: { player: { include: { user: true } }, opportunity: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, applications });
  }

  if (session.user.role !== 'ADMIN') return forbidden();
  const applications = await prisma.application.findMany({
    include: { player: { include: { user: true } }, opportunity: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, applications });
}

/** POST /api/applications — the player sends an application to an opportunity. */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const opportunityId = stringField(body, 'opportunityId');
  if (!opportunityId) return badRequest('opportunityId is required');

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) return forbidden('Player profile not found');

  const application = await prisma.application.upsert({
    where: { playerId_opportunityId: { playerId: player.id, opportunityId } },
    update: {},
    create: {
      playerId: player.id,
      opportunityId,
      message: stringField(body, 'message'),
    },
  });
  return NextResponse.json({ ok: true, application }, { status: 201 });
}

