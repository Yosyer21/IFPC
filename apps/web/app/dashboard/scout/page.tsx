import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { StatCard } from '@/components/player/stat-card';
import { CountUp } from '@/components/player/count-up';
import { PlayerAvatar } from '@/components/player/avatar';
import {
  IconBell,
  IconSearch,
  IconShield,
  IconStar,
  IconTarget,
  IconUsers,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Puesto de scouting' };

export default async function ScoutDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const scout = await prisma.scout.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!scout) notFound();

  const [availableCount, saved, reports, openOpportunities] = await Promise.all([
    prisma.player.count({ where: { status: 'AVAILABLE' } }),
    prisma.savedPlayer.findMany({
      where: { scoutId: scout.id },
      include: { player: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.scoutingReport.findMany({
      where: { scoutId: scout.id },
      include: { player: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.opportunity.count({ where: { status: 'OPEN' } }),
  ]);

  const reportedPlayerIds = new Set(reports.map((report) => report.playerId));
  const savedWithoutReport = saved.filter((entry) => !reportedPlayerIds.has(entry.playerId));

  // Ratings distribution
  const high = reports.filter((r) => r.rating >= 8).length;
  const medium = reports.filter((r) => r.rating >= 6 && r.rating < 8).length;
  const low = reports.filter((r) => r.rating < 6).length;

  const kpis = [
    {
      href: '/dashboard/scout/players',
      icon: IconUsers,
      label: 'Available players',
      value: availableCount,
    },
    {
      href: '/dashboard/scout/saved',
      icon: IconStar,
      label: 'Jugadores guardados',
      value: saved.length,
    },
    {
      href: '/dashboard/scout/scouting-reports',
      icon: IconWhistle,
      label: 'Informes creados',
      value: reports.length,
    },
    {
      href: '/dashboard/scout/opportunities',
      icon: IconTarget,
      label: 'Oportunidades abiertas',
      value: openOpportunities,
    },
  ];

  const pipeline = [
    {
      href: '/dashboard/scout/players',
      label: 'Explorar',
      sub: 'jugadores disponibles',
      value: availableCount,
      icon: IconSearch,
    },
    {
      href: '/dashboard/scout/saved',
      label: 'Guardados',
      sub: 'en tu radar',
      value: saved.length,
      icon: IconStar,
    },
    {
      href: '/dashboard/scout/scouting-reports',
      label: 'Informes',
      sub: 'realizados',
      value: reports.length,
      icon: IconWhistle,
    },
  ];

  // Pending actions
  const pendingActions: { href: string; icon: typeof IconBell; text: string; meta: string }[] = [];
  if (savedWithoutReport.length > 0) {
    pendingActions.push({
      href: '/dashboard/scout/scouting-reports',
      icon: IconWhistle,
      text: `${savedWithoutReport.length} jugador${savedWithoutReport.length === 1 ? '' : 'es'} guardado${savedWithoutReport.length === 1 ? '' : 's'} sin informe`,
      meta: 'Crear informe',
    });
  }

  const [scoutFirstName = 'Ojeador', scoutLastName = ''] = scout.user.name.split(' ');

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <PlayerAvatar firstName={scoutFirstName} lastName={scoutLastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {scoutFirstName} {scoutLastName}
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                Ojeador
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {scout.agency ?? 'Scouting'}
              {saved.length > 0
                ? ` · ${saved.length} jugador${saved.length === 1 ? '' : 'es'} en tu radar`
                : ' · empieza explorando jugadores'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/scout/players"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              Search players
            </Link>
            <Link
              href="/dashboard/scout/scouting-reports"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              New report
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: '/dashboard/scout/players', icon: IconSearch, label: 'Explore players' },
            { href: '/dashboard/scout/saved', icon: IconStar, label: 'My radar' },
            { href: '/dashboard/scout/scouting-reports', icon: IconWhistle, label: 'Informes' },
            { href: '/dashboard/scout/opportunities', icon: IconTarget, label: 'Oportunidades' },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="animate-fade-up flex items-center justify-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                <Icon className="h-4 w-4 text-primary" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Dynamic alert */}
      {pendingActions.length > 0 ? (
        <div className="animate-fade-up mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <IconBell className="h-4 w-4" />
          </span>
          <p className="flex-1 text-sm text-amber-100">
            You have <strong>{pendingActions.length} action{pendingActions.length === 1 ? '' : 's'} pending</strong> en tu puesto de scouting.
          </p>
          <Link
            href={pendingActions[0]!.href}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-400"
          >
            {pendingActions[0]!.meta}
          </Link>
        </div>
      ) : (
        <div className="animate-fade-up mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
            <IconShield className="h-4 w-4" />
          </span>
          <p className="text-sm text-emerald-100">
            All caught up. You have no pending actions in your scouting position.
          </p>
        </div>
      )}
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.label} {...kpi} delay={80 + i * 70} />
        ))}
      </div>

      {/* Pipeline de scouting */}
      <Card className="animate-fade-up mb-6" style={{ animationDelay: '320ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Scouting process</h2>
            <Link href="/dashboard/scout/players" className="text-sm text-primary hover:underline">
              Explore players →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {pipeline.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <Link
                  key={stage.label}
                  href={stage.href}
                  className="animate-fade-up group block"
                  style={{ animationDelay: `${360 + i * 60}ms` }}
                >
                  <Card className="card-hover h-full">
                    <CardContent className="flex flex-col items-center gap-1 text-center">
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="text-3xl font-bold tabular-nums">
                        <CountUp value={stage.value} />
                      </div>
                      <div className="text-sm font-medium">{stage.label}</div>
                      <div className="text-xs text-muted-foreground">{stage.sub}</div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Valoraciones + guardados sin informe */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '500ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Ratings distribution</h2>
            {reports.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                When you create scouting reports, you will see here the distribution of your ratings
                (altas, medias y bajas).
              </p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {high > 0 ? (
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(high / reports.length) * 100}%` }}
                    />
                  ) : null}
                  {medium > 0 ? (
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${(medium / reports.length) * 100}%` }}
                    />
                  ) : null}
                  {low > 0 ? (
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(low / reports.length) * 100}%` }}
                    />
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Altas (8-10) <strong className="tabular-nums">{high}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Averages (6-7) <strong className="tabular-nums">{medium}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Bajas (≤5) <strong className="tabular-nums">{low}</strong>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '560ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Saved without report</h2>
              {savedWithoutReport.length > 0 ? (
                <Link
                  href="/dashboard/scout/scouting-reports"
                  className="text-sm text-primary hover:underline"
                >
                  Crear →
                </Link>
              ) : null}
            </div>
            {savedWithoutReport.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All your saved players have a report or you haven't saved any yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {savedWithoutReport.map(({ player }) => (
                  <div key={player.id} className="flex items-center gap-3">
                    <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {player.position ?? 'No position'}
                      </div>
                    </div>
                    <Link
                      href="/dashboard/scout/scouting-reports"
                      className="text-xs text-primary hover:underline"
                    >
                      Informar →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* My radar + informes recientes */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up" style={{ animationDelay: '620ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">My radar</h2>
              <Link href="/dashboard/scout/saved" className="text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            {saved.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Save interesting players to follow them here.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {saved.slice(0, 5).map(({ player }) => {
                  const positionLabel = player.position
                    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                      player.position)
                    : 'No position';
                  const hasReport = reportedPlayerIds.has(player.id);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 rounded-md border border-border p-3"
                    >
                      <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{positionLabel}</div>
                      </div>
                      <Badge variant={hasReport ? 'success' : 'warning'}>
                        {hasReport ? 'Informado' : 'Sin informe'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '680ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Recent reports</h2>
            {reports.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Crea tu primer informe de scouting para documentar el talento que encuentres.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconWhistle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {report.player.firstName} {report.player.lastName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {report.strengths ? `Fortalezas: ${report.strengths}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {report.createdAt.toLocaleDateString('es')}
                      </div>
                    </div>
                    <Badge
                      variant={report.rating >= 8 ? 'success' : report.rating >= 6 ? 'warning' : 'danger'}
                    >
                      {report.rating}/10
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





