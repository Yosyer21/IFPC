import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import {
  requireUser,
  forbidden,
  badRequest,
  readJson,
  stringField,
  intField,
  dateField,
} from '@/lib/api/respond';

/**
 * GET /api/camps
 * - Admin: todos.
 * - Otros roles: camps abiertos/llenos.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const camps = await prisma.camp.findMany({
    where:
      session.user.role === 'ADMIN'
        ? undefined
        : { status: { in: ['OPEN', 'FULL'] } },
    include: {
      coach: { include: { user: true } },
      club: true,
      _count: { select: { registrations: true } },
    },
    orderBy: { startsAt: 'asc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, camps });
}

/** POST /api/camps — crea un camp (solo admin). */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const body = await readJson(request);
  if (!body) return badRequest('Cuerpo JSON no válido');

  const title = stringField(body, 'title');
  if (!title) return badRequest('title es obligatorio');

  const camp = await prisma.camp.create({
    data: {
      title,
      description: stringField(body, 'description'),
      country: stringField(body, 'country'),
      city: stringField(body, 'city'),
      startsAt: dateField(body, 'startsAt') ?? new Date(),
      endsAt: dateField(body, 'endsAt'),
      capacity: intField(body, 'capacity'),
      price: intField(body, 'price'),
      status: (stringField(body, 'status') as 'DRAFT' | 'OPEN' | 'FULL' | 'CANCELLED' | 'FINISHED') ?? 'DRAFT',
      coachId: stringField(body, 'coachId'),
      clubId: stringField(body, 'clubId'),
    },
  });
  return NextResponse.json({ ok: true, camp }, { status: 201 });
}

