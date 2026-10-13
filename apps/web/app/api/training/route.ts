import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/training — training content catalog. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const content = await prisma.trainingContent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          passScore: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });
  return NextResponse.json({ ok: true, content });
}

export async function POST() {
  return methodNotAllowed();
}

