import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';
import { requireUser, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/training — catálogo de contenido de entrenamiento. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const content = await prisma.trainingContent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, content });
}

export async function POST() {
  return methodNotAllowed();
}

