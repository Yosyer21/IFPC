import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/parent-education — guides for families (parent-education category). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const articles = await prisma.trainingContent.findMany({
    where: { category: 'parent-education' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ ok: true, articles });
}

export async function POST() {
  return methodNotAllowed();
}

