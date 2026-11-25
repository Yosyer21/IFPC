import { publicUserSelect } from '@/lib/api/user-select';
import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import {
  requireUser,
  badRequest,
  forbidden,
  isSameOrigin,
  readJson,
  stringField,
  intField,
} from '@/lib/api/respond';
import { isVisibleToClubs, isVisibleToSchools } from '@/lib/minor';

/**
 * GET /api/players
 * - Player: su propio perfil.
 * - Admin: todos los players.
 * - Otros roles: available players/activos (directorio).
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: publicUserSelect } },
    });
    return NextResponse.json({ ok: true, player });
  }

  const players = await prisma.player.findMany({
    where:
      session.user.role === 'ADMIN'
        ? undefined
        : { status: { in: ['AVAILABLE', 'ACTIVE'] } },
    include: {
      user: { select: publicUserSelect },
      parents: { select: { idVisibleToClubs: true, idVisibleToSchools: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  // La API no puede saltarse la decisión del padre: filtra por la visibilidad
  // que corresponde al rol (clubes/scouts vs colegios/universidades).
  if (session.user.role !== 'ADMIN') {
    const forSchools = session.user.role === 'UNIVERSITY' || session.user.role === 'SCHOOL';
    const visible = players.filter((player) =>
      forSchools
        ? isVisibleToSchools(player.dateOfBirth, player.parents)
        : isVisibleToClubs(player.dateOfBirth, player.parents)
    );
    return NextResponse.json({ ok: true, players: visible });
  }

  return NextResponse.json({ ok: true, players });
}

/** POST /api/players — crea/actualiza el perfil deportivo del player autenticado. */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'PLAYER') return forbidden('Only players can edit a player profile');
  if (!isSameOrigin(request)) return forbidden('Cross-site request blocked');
  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const firstName = stringField(body, 'firstName');
  if (!firstName) return badRequest('firstName is required');

  const data = {
    firstName,
    lastName: stringField(body, 'lastName') ?? '',
    position: stringField(body, 'position'),
    nationality: stringField(body, 'nationality'),
    competitionLevel: stringField(body, 'competitionLevel'),
    foot: stringField(body, 'foot'),
    bio: stringField(body, 'bio'),
    clubName: stringField(body, 'clubName'),
    heightCm: intField(body, 'heightCm'),
    weightKg: intField(body, 'weightKg'),
  };

  const player = await prisma.player.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });
  return NextResponse.json({ ok: true, player }, { status: 201 });
}

