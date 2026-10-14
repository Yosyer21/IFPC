import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import {
  requireUser,
  badRequest,
  readJson,
  stringField,
  dateField,
} from '@/lib/api/respond';
import { clubCoachIds, userClubIds } from '@/lib/live-sessions';

/** Campos que devuelve la API para cada sesión. */
const SESSION_INCLUDE = {
  coach: { include: { user: true } },
  club: true,
  player: { include: { user: true } },
} as const;

/**
 * GET /api/live-sessions
 * - Player: sus 1:1, las públicas, las de sus clubes y las de sus coaches.
 * - Coach: las suyas.
 * - Club: las suyas, las de sus entrenadores y las públicas.
 * - Admin: todas. Cualquier otro perfil: solo las públicas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) return NextResponse.json({ ok: true, sessions: [] });

    const [myClubIds, links] = await Promise.all([
      userClubIds(session.user.id),
      prisma.coachPlayer.findMany({ where: { playerId: player.id }, select: { coachId: true } }),
    ]);
    const coachIds = links.map((row) => row.coachId);

    const sessions = await prisma.liveSession.findMany({
      where: {
        OR: [
          { playerId: player.id },
          { playerId: null, visibility: 'PUBLIC' },
          ...(myClubIds.length
            ? [{ playerId: null, visibility: 'CLUB' as const, clubId: { in: myClubIds } }]
            : []),
          ...(coachIds.length
            ? [{ playerId: null, visibility: 'CLUB' as const, coachId: { in: coachIds } }]
            : []),
        ],
      },
      include: SESSION_INCLUDE,
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
      include: SESSION_INCLUDE,
      orderBy: { startsAt: 'asc' },
      take: 100,
    });
    return NextResponse.json({ ok: true, sessions });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!club) return NextResponse.json({ ok: true, sessions: [] });

    const coachIds = await clubCoachIds(club.id);
    const sessions = await prisma.liveSession.findMany({
      where: {
        playerId: null,
        OR: [
          { clubId: club.id },
          ...(coachIds.length ? [{ coachId: { in: coachIds } }] : []),
          { visibility: 'PUBLIC' as const },
        ],
      },
      include: SESSION_INCLUDE,
      orderBy: { startsAt: 'asc' },
      take: 50,
    });
    return NextResponse.json({ ok: true, sessions });
  }

  // Admin ve todo; el resto de perfiles solo lo público (nunca las 1:1 de otros).
  const sessions = await prisma.liveSession.findMany({
    where: session.user.role === 'ADMIN' ? {} : { playerId: null, visibility: 'PUBLIC' },
    include: SESSION_INCLUDE,
    orderBy: { startsAt: 'asc' },
    take: session.user.role === 'ADMIN' ? 200 : 50,
  });
  return NextResponse.json({ ok: true, sessions });
}

/** POST /api/live-sessions — creates a session (admin or coach). */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const title = stringField(body, 'title');
  if (!title) return badRequest('title is required');

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

