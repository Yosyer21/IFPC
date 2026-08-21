import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { requireUser } from '@/lib/api/respond';

/** GET /api/notifications — notificaciones del usuario autenticado. */
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ ok: true, notifications, unread });
}

/** POST /api/notifications — marca todas las notificaciones como leídas. */
export async function POST() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const result = await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true, updated: result.count });
}

