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
 * GET /api/scouting — informes de scouting.
 * - Scout: sus informes.
 * - Admin: todos.
 */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'SCOUT') {
    const scout = await prisma.scout.findUnique({ where: { userId: session.user.id } });
    if (!scout) return NextResponse.json({ ok: true, reports: [] });
    const reports = await prisma.scoutingReport.findMany({
      where: { scoutId: scout.id },
      include: { player: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, reports });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status: 403 });
  }
  const reports = await prisma.scoutingReport.findMany({
    include: { player: { include: { user: true } }, scout: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, reports });
}

/** POST /api/scouting — el scout crea un informe de un jugador. */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const playerId = stringField(body, 'playerId');
  const rating = intField(body, 'rating');
  if (!playerId || rating === null || rating < 1 || rating > 10) {
    return badRequest('playerId y rating (1-10) son obligatorios');
  }

  const scout = await prisma.scout.findUnique({ where: { userId: session.user.id } });
  if (!scout) {
    return NextResponse.json({ ok: false, error: 'Profile de ojeador no encontrado' }, { status: 403 });
  }

  const report = await prisma.scoutingReport.create({
    data: {
      scoutId: scout.id,
      playerId,
      rating,
      strengths: stringField(body, 'strengths'),
      weaknesses: stringField(body, 'weaknesses'),
      notes: stringField(body, 'notes'),
    },
  });
  return NextResponse.json({ ok: true, report }, { status: 201 });
}

