import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PLAYER_STATUSES, PLAYER_STATUS_LABELS, POSITIONS, POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { IconTrendingUp, IconUser, IconUsers, IconWhistle } from '@/components/dashboard/icons';
import { monthlyCounts } from '@/components/admin/analytics-utils';

export const metadata: Metadata = { title: 'Analytics · Jugadores' };

export default async function AdminAnalyticsPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const players = await prisma.player.findMany({
    select: { status: true, position: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const total = players.length;
  const available = players.filter((p) => p.status === 'AVAILABLE').length;
  const active = players.filter((p) => p.status === 'ACTIVE').length;
  const pending = players.filter((p) => p.status === 'PENDING_VERIFICATION').length;

  const byStatus = PLAYER_STATUSES.map((status) => ({
    label: PLAYER_STATUS_LABELS[status],
    value: players.filter((p) => p.status === status).length,
  }));

  const byPosition = POSITIONS.map((position) => ({
    label: POSITION_LABELS[position],
    value: players.filter((p) => p.position === position).length,
  })).filter((item) => item.value > 0);

  const monthly = monthlyCounts(players, 6);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analytics de jugadores"
        subtitle="Distribución de perfiles y evolución de registros"
        icon="trending"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="/dashboard/admin/players" icon={IconUsers} label="Jugadores totales" value={total} />
        <StatCard href="/dashboard/admin/players/active" icon={IconUser} label="Activos" value={active} />
        <StatCard href="/dashboard/admin/players" icon={IconWhistle} label="Disponibles" value={available} />
        <StatCard href="/dashboard/admin/players/pending" icon={IconTrendingUp} label="Pendientes" value={pending} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Por estado</h2>
            <CountsBars items={byStatus} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Por posición</h2>
            {byPosition.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin posiciones registradas.</p>
            ) : (
              <CountsBars items={byPosition} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent>
          <h2 className="mb-4 font-semibold">Registros por mes</h2>
          <CountsBars items={monthly} />
        </CardContent>
      </Card>
    </div>
  );
}
