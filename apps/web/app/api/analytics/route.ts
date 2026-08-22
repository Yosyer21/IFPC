import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/analytics — conteos de la plataforma (solo admin). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const [
    users,
    players,
    clubs,
    universities,
    openOpportunities,
    applications,
    submissions,
    payments,
    revenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.player.count(),
    prisma.club.count(),
    prisma.university.count(),
    prisma.opportunity.count({ where: { status: 'OPEN' } }),
    prisma.application.count(),
    prisma.submission.count(),
    prisma.payment.count({ where: { status: 'PAID' } }),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    ok: true,
    analytics: {
      users,
      players,
      clubs,
      universities,
      openOpportunities,
      applications,
      submissions,
      payments,
      revenueCents: revenue._sum.amount ?? 0,
    },
  });
}

export async function POST() {
  return methodNotAllowed();
}

