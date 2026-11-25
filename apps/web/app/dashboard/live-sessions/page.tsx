import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { StatusBadge } from '@/components/admin/status-badge';
import { PageHeader } from '@/components/player/page-header';
import { LIVE_SESSION_TYPE_LABELS, LIVE_SESSION_VISIBILITY_LABELS } from '@/lib/labels';
import { userClubIds } from '@/lib/live-sessions';

export const metadata: Metadata = { title: 'Live sessions' };

/**
 * Lobby compartido de sesiones en directo.
 *
 * Health agents (y cualquier rol sin un panel propio de lives) aterrizan aquí
 * desde el menú. Solo se listan las sesiones públicas y las de los clubes a los
 * que pertenece el usuario; las 1:1 nunca se exponen en este índice. El acceso
 * final se vuelve a comprobar en la página de detalle con `canViewLiveSession`.
 */
export default async function SharedLiveSessionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const clubIds = await userClubIds(session.user.id);
  const sessions = await prisma.liveSession.findMany({
    where:
      session.user.role === 'ADMIN'
        ? {}
        : {
            playerId: null,
            OR: [
              { visibility: 'PUBLIC' },
              ...(clubIds.length
                ? [{ visibility: 'CLUB' as const, clubId: { in: clubIds } }]
                : []),
            ],
          },
    include: { coach: { include: { user: true } }, club: true },
    orderBy: { startsAt: 'asc' },
    take: 50,
  });

  const now = new Date();
  const upcoming = sessions.filter((row) => row.startsAt > now && row.status !== 'CANCELLED');
  const past = sessions.filter((row) => row.startsAt <= now || row.status === 'CANCELLED');

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Live sessions"
        subtitle="Live training, talks and trials from clubs and coaches on Future Baller"
        icon="live"
      />

      <h2 className="mb-3 font-semibold">Upcoming</h2>
      {upcoming.length === 0 ? (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No live sessions are scheduled right now. Public sessions published by clubs and
              coaches will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-3">
          {upcoming.map((liveSession) => (
            <Link key={liveSession.id} href={`/dashboard/live-sessions/${liveSession.id}`}>
              <Card className="card-hover">
                <CardContent className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{liveSession.title}</span>
                      <StatusBadge status={liveSession.status} />
                      <Badge variant="outline">
                        {LIVE_SESSION_VISIBILITY_LABELS[liveSession.visibility] ??
                          liveSession.visibility}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {LIVE_SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type} ·{' '}
                      {liveSession.startsAt.toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    {liveSession.coach?.user?.name || liveSession.club?.name ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {[liveSession.coach?.user?.name, liveSession.club?.name]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-brand">Open session →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-semibold">Earlier</h2>
      {past.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No earlier sessions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {past.map((liveSession) => (
            <Link key={liveSession.id} href={`/dashboard/live-sessions/${liveSession.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{liveSession.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {liveSession.startsAt.toLocaleDateString('en-GB')}
                    {liveSession.club?.name ? ` · ${liveSession.club.name}` : ''}
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
