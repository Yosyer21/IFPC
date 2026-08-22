import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { SESSION_TYPE_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Sesión en vivo' };

export default async function PlayerLiveSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: { coach: { include: { user: true } } },
  });
  if (!liveSession) notFound();

  const canView =
    liveSession.playerId === player.id ||
    (!liveSession.playerId && liveSession.type !== 'TRIAL');
  if (!canView) notFound();

  const isUpcoming = liveSession.startsAt > new Date();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={liveSession.title}
        subtitle={`${SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type} · ${
          liveSession.coach?.user?.name ?? 'Plataforma'
        }`}
        icon="live"
      >
        <Link href="/dashboard/player/live-sessions" className="text-sm text-muted-foreground hover:underline">
          ← Sesiones en vivo
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <StatusBadge status={liveSession.status} />
            <Badge variant="outline">
              {liveSession.startsAt.toLocaleDateString('es')}{' '}
              {liveSession.startsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              {liveSession.endsAt
                ? ` → ${liveSession.endsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </Badge>
          </div>

          <h2 className="mb-2 font-semibold">Descripción</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {liveSession.description ?? 'Sin descripción.'}
          </p>

          {isUpcoming && liveSession.meetingUrl ? (
            <a
              href={liveSession.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Entrar en la sesión
            </a>
          ) : (
            <p className="mt-5 text-xs text-muted-foreground">
              {isUpcoming
                ? 'El enlace de la sesión se activará cuando empiece.'
                : 'Esta sesión ya ha finalizado.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

