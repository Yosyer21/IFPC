import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { changeLiveSessionStatusAction } from '@/app/actions/admin';
import { LIVE_SESSION_STATUS_LABELS, LIVE_SESSION_TYPE_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Live session' };

export default async function AdminLiveSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      coach: { include: { user: true } },
      player: { include: { user: true } },
    },
  });
  if (!liveSession) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={liveSession.title}
        subtitle={`${LIVE_SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type} · ${
          LIVE_SESSION_STATUS_LABELS[liveSession.status] ?? liveSession.status
        }`}
        icon="live"
      >
        <Link
          href="/dashboard/admin/live-sessions"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Sesiones en vivo
        </Link>
      </PageHeader>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <div className="text-xs text-muted-foreground">Inicio</div>
              <div className="mt-1 font-medium">
                {liveSession.startsAt.toLocaleDateString('es')}{' '}
                {liveSession.startsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs text-muted-foreground">Fin</div>
              <div className="mt-1 font-medium">
                {liveSession.endsAt
                  ? `${liveSession.endsAt.toLocaleDateString('es')} ${liveSession.endsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
                  : '—'}
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs text-muted-foreground">Entrenador</div>
              <div className="mt-1 font-medium">{liveSession.coach?.user?.name ?? 'Sin asignar'}</div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs text-muted-foreground">Jugador (1:1)</div>
              <div className="mt-1 font-medium">
                {liveSession.player
                  ? `${liveSession.player.firstName} ${liveSession.player.lastName}`
                  : 'Grupo / sin jugador'}
              </div>
            </div>
          </div>

          <h2 className="mb-2 mt-5 font-semibold">Description</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {liveSession.description ?? 'No description.'}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusBadge status={liveSession.status} />
            {liveSession.meetingUrl ? (
              <a
                href={liveSession.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open meeting
              </a>
            ) : null}
          </div>

          <form action={changeLiveSessionStatusAction} className="mt-4 flex items-center gap-2">
            <input type="hidden" name="sessionId" value={liveSession.id} />
            <select
              name="status"
              defaultValue={liveSession.status}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              {Object.entries(LIVE_SESSION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Update status
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


