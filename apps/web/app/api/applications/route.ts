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
 * - Jugador: sus solicitudes.
 * - Club: solicitudes recibidas en sus oportunidades.
 * - Admin: todas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
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
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const opportunityId = stringField(body, 'opportunityId');
  if (!opportunityId) return badRequest('opportunityId es obligatorio');

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) return forbidden('Profile de jugador no encontrado');

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

