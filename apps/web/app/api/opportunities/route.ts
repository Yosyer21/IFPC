import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
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
 * GET /api/opportunities
 * - Club: sus propias oportunidades.
 * - Universidad: las suyas.
 * - Otros roles (incluido admin): oportunidades abiertas.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
    if (!club) return NextResponse.json({ ok: true, opportunities: [] });
    const opportunities = await prisma.opportunity.findMany({
      where: { clubId: club.id },
      include: { club: true, university: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, opportunities });
  }

  if (session.user.role === 'UNIVERSITY') {
    const university = await prisma.university.findUnique({
      where: { userId: session.user.id },
    });
    if (!university) return NextResponse.json({ ok: true, opportunities: [] });
    const opportunities = await prisma.opportunity.findMany({
      where: { universityId: university.id },
      include: { club: true, university: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, opportunities });
  }

  const opportunities = await prisma.opportunity.findMany({
    where: session.user.role === 'ADMIN' ? undefined : { status: 'OPEN' },
    include: { club: true, university: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, opportunities });
}

/** POST /api/opportunities — publica una oportunidad (club, universidad o admin). */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await readJson(request);
  if (!body) return badRequest('Cuerpo JSON no válido');

  const title = stringField(body, 'title');
  if (!title) return badRequest('title es obligatorio');

  const type = stringField(body, 'type') ?? 'TRIAL';
  const validTypes = ['TRIAL', 'SCOUTING', 'CONTRACT', 'SCHOLARSHIP', 'ACADEMY'];
  if (!validTypes.includes(type)) return badRequest('type no válido');

  let clubId: string | null = null;
  let universityId: string | null = null;
  const creatorType = stringField(body, 'creatorType') ?? 'CLUB';

  if (session.user.role === 'CLUB' || (session.user.role === 'ADMIN' && creatorType === 'CLUB')) {
    if (session.user.role === 'CLUB') {
      const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
      clubId = club?.id ?? null;
    } else {
      clubId = stringField(body, 'clubId');
    }
  } else if (
    session.user.role === 'UNIVERSITY' ||
    (session.user.role === 'ADMIN' && creatorType === 'UNIVERSITY')
  ) {
    if (session.user.role === 'UNIVERSITY') {
      const university = await prisma.university.findUnique({
        where: { userId: session.user.id },
      });
      universityId = university?.id ?? null;
    } else {
      universityId = stringField(body, 'universityId');
    }
  } else {
    return forbidden();
  }
  if (!clubId && !universityId) return forbidden('Sin entidad propietaria');

  const opportunity = await prisma.opportunity.create({
    data: {
      title,
      creatorType,
      clubId,
      universityId,
      type: type as 'TRIAL' | 'SCOUTING' | 'CONTRACT' | 'SCHOLARSHIP' | 'ACADEMY',
      status: (stringField(body, 'status') as 'DRAFT' | 'OPEN' | 'CLOSED') ?? 'OPEN',
      position: stringField(body, 'position'),
      location: stringField(body, 'location'),
      description: stringField(body, 'description'),
      ageMin: intField(body, 'ageMin'),
      ageMax: intField(body, 'ageMax'),
      closesAt: dateField(body, 'closesAt'),
    },
  });
  return NextResponse.json({ ok: true, opportunity }, { status: 201 });
}

