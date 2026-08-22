import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import {
  requireUser,
  badRequest,
  readJson,
  stringField,
  dateField,
} from '@/lib/api/respond';

/**
 * GET /api/live-sessions
 * - Jugador: sus sesiones + grupales abiertas.
 * - Coach: las suyas.
 * - Admin: todas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) return NextResponse.json({ ok: true, sessions: [] });
    const sessions = await prisma.liveSession.findMany({
      where: {
        OR: [
          { playerId: player.id },
          { playerId: null, type: { in: ['TRAINING', 'LECTURE', 'Q_AND_A'] } },
        ],
      },
      include: { coach: { include: { user: true } }, player: true },
      orderBy: { startsAt: 'asc' },
      take: 50,
    });
    return NextResponse.json({ ok: true, sessions });
  }

  if (session.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
    if (!coach) return NextResponse.json({ ok: true, sessions: [] });
    const sessions = await prisma.liveSession.findMany({
      where: { coachId: coach.id },
      include: { player: { include: { user: true } } },
      orderBy: { startsAt: 'asc' },
      take: 100,
    });
    return NextResponse.json({ ok: true, sessions });
  }

  const sessions = await prisma.liveSession.findMany({
    include: { coach: { include: { user: true } }, player: true },
    orderBy: { startsAt: 'asc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, sessions });
}

/** POST /api/live-sessions — crea una sesión (admin o coach). */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await readJson(request);
  if (!body) return badRequest('Cuerpo JSON no válido');

  const title = stringField(body, 'title');
  if (!title) return badRequest('title es obligatorio');

  let coachId: string | null = stringField(body, 'coachId');
  if (session.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
    coachId = coach?.id ?? null;
  }

  const liveSession = await prisma.liveSession.create({
    data: {
      title,
      description: stringField(body, 'description'),
      type: (stringField(body, 'type') as 'TRAINING' | 'LECTURE' | 'Q_AND_A' | 'TRIAL') ?? 'TRAINING',
      status: (stringField(body, 'status') as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED') ?? 'SCHEDULED',
      startsAt: dateField(body, 'startsAt') ?? new Date(),
      endsAt: dateField(body, 'endsAt'),
      meetingUrl: stringField(body, 'meetingUrl'),
      coachId,
      playerId: stringField(body, 'playerId'),
    },
  });
  return NextResponse.json({ ok: true, liveSession }, { status: 201 });
}

