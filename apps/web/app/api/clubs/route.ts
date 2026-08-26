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
 * GET /api/clubs
 * - Club: su propio perfil.
 * - Admin: todos los clubes.
 * - Otros roles: clubes verificados.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });
    return NextResponse.json({ ok: true, club });
  }

  const clubs = await prisma.club.findMany({
    where: session.user.role === 'ADMIN' ? undefined : { verified: true },
    include: { user: true },
    orderBy: { name: 'asc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, clubs });
}

/** POST /api/clubs — crea un club (solo admin). */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const name = stringField(body, 'name');
  const email = stringField(body, 'email');
  const country = stringField(body, 'country');
  if (!name || !email || !country) return badRequest('name, email y country son obligatorios');

  const club = await prisma.club.create({
    data: {
      name,
      email,
      country,
      city: stringField(body, 'city'),
      league: stringField(body, 'league'),
      description: stringField(body, 'description'),
    },
  });
  return NextResponse.json({ ok: true, club }, { status: 201 });
}

