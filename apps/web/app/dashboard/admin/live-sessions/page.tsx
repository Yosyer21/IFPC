import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { StatusBadge } from '@/components/admin/status-badge';
import { IconCalendar, IconClock, IconLive, IconVideo } from '@/components/dashboard/icons';
import { changeLiveSessionStatusAction, deleteLiveSessionAction } from '@/app/actions/admin';
import { LIVE_SESSION_STATUS_LABELS, LIVE_SESSION_TYPE_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Sesiones en vivo' };

export default async function AdminLiveSessionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sessions = await prisma.liveSession.findMany({
    include: { coach: { include: { user: true } }, player: { include: { user: true } } },
    orderBy: { startsAt: 'asc' },
    take: 100,
  });

  const now = new Date();
  const upcoming = sessions.filter(
    (s) => s.status === 'SCHEDULED' && s.startsAt > now
  ).length;
  const live = sessions.filter((s) => s.status === 'LIVE').length;
  const total = sessions.length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Sesiones en vivo"
        subtitle="Entrenamientos en directo, charlas y pruebas organizadas"
        icon="live"
      >
        <Link
          href="/dashboard/admin/live-sessions/create"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          New session
        </Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard href="/dashboard/admin/live-sessions" icon={IconLive} label="Total sesiones" value={total} />
        <StatCard href="/dashboard/admin/live-sessions" icon={IconClock} label="Upcoming" value={upcoming} />
        <StatCard href="/dashboard/admin/live-sessions" icon={IconVideo} label="En directo" value={live} />
        <StatCard href="/dashboard/admin/live-sessions" icon={IconCalendar} label="Ended" value={sessions.filter((s) => s.status === 'ENDED').length} />
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No live sessions yet. Create the first one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {/* LIVE_ROWS */}
          {sessions.map((session) => (
            <Card key={session.id} className="card-hover">
              <CardContent className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/admin/live-sessions/${session.id}`}
                      className="font-semibold hover:underline"
                    >
                      {session.title}
                    </Link>
                    <StatusBadge status={session.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {LIVE_SESSION_TYPE_LABELS[session.type] ?? session.type} ·{' '}
                    {session.startsAt.toLocaleDateString('es')}{' '}
                    {session.startsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    {session.endsAt
                      ? ` → ${session.endsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {session.coach?.user?.name ? (
                      <Badge variant="outline">Coach: {session.coach.user.name}</Badge>
                    ) : null}
                    {session.player ? (
                      <Badge variant="outline">
                        Jugador: {session.player.firstName} {session.player.lastName}
                      </Badge>
                    ) : null}
                    {session.meetingUrl ? (
                      <Badge variant="outline">Meeting link</Badge>
                    ) : null}
                  </div>
                </div>

                <form action={changeLiveSessionStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <select
                    name="status"
                    defaultValue={session.status}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    {Object.entries(LIVE_SESSION_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-muted"
                  >
                    Actualizar
                  </button>
                </form>

                <form action={deleteLiveSessionAction}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Eliminar
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


