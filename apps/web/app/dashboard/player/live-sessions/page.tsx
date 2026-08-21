import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { SESSION_TYPE_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Sesiones en vivo' };

export default async function PlayerLiveSessionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const sessions = await prisma.liveSession.findMany({
    where: {
      OR: [
        { playerId: player.id },
        { playerId: null, type: { in: ['TRAINING', 'LECTURE', 'Q_AND_A'] } },
      ],
    },
    include: { coach: { include: { user: true } } },
    orderBy: { startsAt: 'asc' },
    take: 50,
  });

  const now = new Date();
  const upcoming = sessions.filter((s) => s.startsAt > now);
  const past = sessions.filter((s) => s.startsAt <= now);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Sesiones en vivo"
        subtitle="Entrenamientos en directo y pruebas organizadas para ti"
        icon="live"
      />

      <h2 className="mb-3 font-semibold">Próximas</h2>
      {upcoming.length === 0 ? (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No tienes sesiones en vivo programadas. Cuando tu club o un entrenador organicen
              sesiones (entrenamientos, charlas o pruebas), aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-3">
          {upcoming.map((liveSession) => (
            <Link key={liveSession.id} href={`/dashboard/player/live-sessions/${liveSession.id}`}>
              <Card className="card-hover">
                <CardContent className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{liveSession.title}</span>
                      <StatusBadge status={liveSession.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type} ·{' '}
                      {liveSession.startsAt.toLocaleDateString('es')}{' '}
                      {liveSession.startsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {liveSession.coach?.user?.name ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Con {liveSession.coach.user.name}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={liveSession.type === 'TRIAL' ? 'warning' : 'outline'}>
                    {SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-semibold">Finalizadas</h2>
      {past.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aún no hay sesiones finalizadas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {past.map((liveSession) => (
            <Link key={liveSession.id} href={`/dashboard/player/live-sessions/${liveSession.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{liveSession.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {liveSession.startsAt.toLocaleDateString('es')}
                  </div>
                </div>
                <StatusBadge status={liveSession.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

