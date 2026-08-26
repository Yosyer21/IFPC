import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { StatCard } from '@/components/player/stat-card';
import { CountUp } from '@/components/player/count-up';
import { PlayerAvatar } from '@/components/player/avatar';
import {
  IconBell,
  IconBook,
  IconSearch,
  IconShield,
  IconStar,
  IconTarget,
  IconUsers,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Portada universitaria' };

export default async function UniversityDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const university = await prisma.university.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!university) return null;

  const [availablePlayers, openOpportunities, scholarshipCount, scholarshipApplications] =
    await Promise.all([
      prisma.player.findMany({
        where: { status: 'AVAILABLE' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.opportunity.findMany({
        where: { status: 'OPEN' },
        include: { club: true, university: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.opportunity.count({ where: { status: 'OPEN', type: 'SCHOLARSHIP' } }),
      prisma.application.count({
        where: { opportunity: { status: 'OPEN', type: 'SCHOLARSHIP' } },
      }),
    ]);

  const scholarships = openOpportunities.filter((o) => o.type === 'SCHOLARSHIP');
  const expiringScholarships = scholarships.filter(
    (o) => o.closesAt && o.closesAt.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  const kpis = [
    {
      href: '/dashboard/university/players',
      icon: IconUsers,
      label: 'Available players',
      value: availablePlayers.length,
    },
    {
      href: '/dashboard/university/opportunities',
      icon: IconTarget,
      label: 'Oportunidades abiertas',
      value: openOpportunities.length,
    },
    {
      href: '/dashboard/university/opportunities',
      icon: IconBook,
      label: 'Becas disponibles',
      value: scholarshipCount,
    },
    {
      href: '/dashboard/university/opportunities',
      icon: IconStar,
      label: 'Applications a becas',
      value: scholarshipApplications,
    },
  ];

  const pipeline = [
    {
      href: '/dashboard/university/players',
      label: 'Explorar',
      sub: 'jugadores disponibles',
      value: availablePlayers.length,
      icon: IconSearch,
    },
    {
      href: '/dashboard/university/opportunities',
      label: 'Oportunidades',
      sub: 'abiertas',
      value: openOpportunities.length,
      icon: IconTarget,
    },
    {
      href: '/dashboard/university/opportunities',
      label: 'Becas',
      sub: 'disponibles',
      value: scholarshipCount,
      icon: IconBook,
    },
  ];

  // Pending actions
  const pendingActions: { href: string; icon: typeof IconBell; text: string; meta: string }[] = [];
  if (expiringScholarships.length > 0) {
    pendingActions.push({
      href: '/dashboard/university/opportunities',
      icon: IconBook,
      text: `${expiringScholarships.length} scholarship${expiringScholarships.length === 1 ? '' : 's'} close${expiringScholarships.length === 1 ? 's' : ''} in the next 7 days`,
      meta: 'Ver plazos',
    });
  }
  if (scholarshipApplications > 0) {
    pendingActions.push({
      href: '/dashboard/university/opportunities',
      icon: IconStar,
      text: `${scholarshipApplications} solicitud${scholarshipApplications === 1 ? '' : 'es'} a becas registrada${scholarshipApplications === 1 ? '' : 's'}`,
      meta: 'Revisar',
    });
  }

  const recentOpportunities = openOpportunities.slice(0, 4);
  const [univFirstName = 'Universidad', univLastName = ''] = university.name.split(' ');

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <PlayerAvatar firstName={univFirstName} lastName={univLastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{university.name}</h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                Universidad
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {university.city ? `${university.city}, ` : ''}
              {university.country} · Academic-sports portal
              {openOpportunities.length > 0
                ? ` · ${openOpportunities.length} oportunidad${openOpportunities.length === 1 ? '' : 'es'} para tus candidatos`
                : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/university/players"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              View players
            </Link>
            <Link
              href="/dashboard/university/opportunities"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Ver oportunidades
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: '/dashboard/university/players', icon: IconSearch, label: 'Explorar talento' },
            { href: '/dashboard/university/opportunities', icon: IconTarget, label: 'Oportunidades' },
            { href: '/dashboard/university/opportunities', icon: IconBook, label: 'Becas' },
            { href: '/dashboard/university/profile', icon: IconShield, label: 'Mi universidad' },
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
            You have <strong>{pendingActions.length} novedad{pendingActions.length === 1 ? '' : 'es'}</strong> en tu portal universitario.
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
            All caught up. No updates in your university portal.
          </p>
        </div>
      )}
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.label} {...kpi} delay={80 + i * 70} />
        ))}
      </div>

      {/* Pipeline */}
      <Card className="animate-fade-up mb-6" style={{ animationDelay: '320ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">University recruitment</h2>
            <Link href="/dashboard/university/players" className="text-sm text-primary hover:underline">
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
      {/* Jugadores + oportunidades destacadas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up" style={{ animationDelay: '440ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Available players</h2>
              <Link href="/dashboard/university/players" className="text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            {availablePlayers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No players available right now.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {availablePlayers.map((player) => {
                  const positionLabel = player.position
                    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                      player.position)
                    : 'No position';
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
                        <div className="truncate text-xs text-muted-foreground">
                          {positionLabel}
                          {player.nationality ? ` · ${player.nationality}` : ''}
                          {player.heightCm ? ` · ${player.heightCm} cm` : ''}
                        </div>
                      </div>
                      <Badge variant="success">Disponible</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '500ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Featured opportunities</h2>
              <Link href="/dashboard/university/opportunities" className="text-sm text-primary hover:underline">
                Ver todas →
              </Link>
            </div>
            {recentOpportunities.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay oportunidades abiertas en la plataforma.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentOpportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="flex items-center gap-3 rounded-md border border-border p-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {opportunity.type === 'SCHOLARSHIP' ? (
                        <IconBook className="h-5 w-5" />
                      ) : (
                        <IconTarget className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{opportunity.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {opportunity.club?.name ?? opportunity.university?.name ?? '—'}
                        {opportunity.location ? ` · ${opportunity.location}` : ''}
                        {opportunity.closesAt
                          ? ` · Cierra ${opportunity.closesAt.toLocaleDateString('es')}`
                          : ''}
                      </div>
                    </div>
                    <Badge variant={opportunity.type === 'SCHOLARSHIP' ? 'success' : 'default'}>
                      {opportunity.type === 'SCHOLARSHIP' ? 'Beca' : opportunity.type}
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




