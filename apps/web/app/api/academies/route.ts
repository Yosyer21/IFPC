import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import {
  requireUser,
  forbidden,
  badRequest,
  readJson,
  stringField,
} from '@/lib/api/respond';

/** GET /api/academies — listado de academias. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const academies = await prisma.academy.findMany({
    orderBy: { name: 'asc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, academies });
}

/** POST /api/academies — crea una academia (solo admin). */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const name = stringField(body, 'name');
  const country = stringField(body, 'country');
  if (!name || !country) return badRequest('name y country son obligatorios');

  const academy = await prisma.academy.create({
    data: {
      name,
      country,
      city: stringField(body, 'city'),
      clubId: stringField(body, 'clubId'),
      description: stringField(body, 'description'),
    },
  });
  return NextResponse.json({ ok: true, academy }, { status: 201 });
}

