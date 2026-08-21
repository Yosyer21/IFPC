import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { requireUser, forbidden, methodNotAllowed } from '@/lib/api/respond';

/** GET /api/communications — conversaciones y mensajes (solo admin). */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') return forbidden();

  const conversations = await prisma.conversation.findMany({
    include: {
      participants: { include: { user: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, conversations });
}

export async function POST() {
  return methodNotAllowed();
}

