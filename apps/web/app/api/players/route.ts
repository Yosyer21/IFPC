import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import {
  requireUser,
  badRequest,
  readJson,
  stringField,
  intField,
} from '@/lib/api/respond';

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
      include: { user: true },
    });
    return NextResponse.json({ ok: true, player });
  }

  const players = await prisma.player.findMany({
    where:
      session.user.role === 'ADMIN'
        ? undefined
        : { status: { in: ['AVAILABLE', 'ACTIVE'] } },
    include: { user: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, players });
}

/** POST /api/players — crea/actualiza el perfil deportivo del player autenticado. */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
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

