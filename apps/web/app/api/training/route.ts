import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { isTrainingKind, isTrainingOrigin } from '@ifpc/config';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';
import { visibleTrainingWhere } from '@/lib/training';

/**
 * GET /api/training — catálogo del Football Center visible para quien consulta:
 * el contenido general, el de sus coaches y clubes y, si publica, el suyo.
 * Filtros opcionales: `?kind=COURSE|EXERCISE` y `?origin=GENERAL|COACH|CLUB`.
 */
export async function GET(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind');
  const origin = searchParams.get('origin');
  const visible = await visibleTrainingWhere(session.user.id);

  const content = await prisma.trainingContent.findMany({
    where: {
      AND: [
        visible,
        ...(isTrainingKind(kind) ? [{ kind }] : []),
        ...(isTrainingOrigin(origin) ? [{ ownerType: origin }] : []),
      ],
    },
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

