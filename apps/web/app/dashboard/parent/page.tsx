import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { StatCard } from '@/components/player/stat-card';
import { PlayerAvatar } from '@/components/player/avatar';
import { DonutChart, RadarChart } from '@/components/player/charts';
import {
  IconBell,
  IconBook,
  IconShield,
  IconStar,
  IconTarget,
  IconUsers,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Hub familiar' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  physical: 'Physical',
  tactical: 'Tactics',
  psychological: 'Psychological',
};

export default async function ParentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!parent) notFound();

  const children = await prisma.parentChild.findMany({
    where: { parentId: parent.id },
    include: { player: true },
    orderBy: { since: 'desc' },
  });
  const childIds = children.map((entry) => entry.playerId);

  const [evaluations, activeGoals, trials, openOpportunities, payments] = await Promise.all([
    prisma.evaluation.findMany({
      where: { playerId: { in: childIds } },
      include: { player: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.playerGoal.count({
      where: { playerId: { in: childIds }, status: { in: ['pending', 'in_progress'] } },
    }),
    prisma.trial.findMany({
      where: { playerId: { in: childIds } },
      include: { player: true, club: true },
      orderBy: { startsAt: 'desc' },
    }),
    prisma.opportunity.count({ where: { status: 'OPEN' } }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const scheduledTrials = trials.filter((t) => t.status === 'SCHEDULED');
  const upcomingTrials = scheduledTrials.filter(
    (t) => t.startsAt.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // Aggregated children level by category
  const byCategory = new Map<string, number[]>();
  for (const evaluation of evaluations) {
    const list = byCategory.get(evaluation.category) ?? [];
    list.push(evaluation.score);
    byCategory.set(evaluation.category, list);
  }
  const radarCategories: string[] = [];
  const radarValues: number[] = [];
  for (const [category, scores] of byCategory) {
    radarCategories.push(CATEGORY_LABELS[category] ?? category);
    radarValues.push(Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10);
  }

  // Average rating
  const overall =
    evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length) * 10) /
        10
      : null;

  const kpis = [
    {
      href: '/dashboard/parent/children',
      icon: IconUsers,
      label: 'Hijos vinculados',
      value: children.length,
    },
    {
      href: '/dashboard/parent/children',
      icon: IconWhistle,
      label: 'Evaluaciones',
      value: evaluations.length,
    },
    {
      href: '/dashboard/parent/children',
      icon: IconTarget,
      label: 'Goals activos',
      value: activeGoals,
    },
    {
      href: '/dashboard/parent/children',
      icon: IconStar,
      label: 'Pruebas programadas',
      value: scheduledTrials.length,
    },
  ];

  // Pending actions
  const pendingActions: { href: string; icon: typeof IconBell; text: string; meta: string }[] = [];
  if (upcomingTrials.length > 0) {
    pendingActions.push({
      href: '/dashboard/parent/children',
      icon: IconStar,
      text: `${upcomingTrials.length} upcoming trial${upcomingTrials.length === 1 ? '' : 's'} in the next 7 days`,
      meta: 'Ver agenda',
    });
  }
  if (openOpportunities > 0) {
    pendingActions.push({
      href: '/dashboard/parent/opportunities',
      icon: IconTarget,
      text: `${openOpportunities} oportunidad${openOpportunities === 1 ? '' : 'es'} abierta${openOpportunities === 1 ? '' : 's'} para explorar`,
      meta: 'Ver oportunidades',
    });
  }

  const recentEvals = evaluations.slice(0, 3);
  const recentTrials = trials.slice(0, 2);
  const [parentFirstName = 'Familiar', parentLastName = ''] = parent.user.name.split(' ');

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <PlayerAvatar firstName={parentFirstName} lastName={parentLastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {parentFirstName} {parentLastName}
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                Familiar
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Family support
              {children.length > 0
                ? ` · ${children.length} hijo${children.length === 1 ? '' : 's'} en la plataforma`
                : ' · vincula a tu hijo para seguir su desarrollo'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/parent/children"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              My children
            </Link>
            <Link
              href="/dashboard/parent/education"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Guides for families
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: '/dashboard/parent/children', icon: IconUsers, label: 'My children' },
            { href: '/dashboard/parent/opportunities', icon: IconTarget, label: 'Oportunidades' },
            { href: '/dashboard/parent/education', icon: IconBook, label: 'Education' },
            { href: '/dashboard/parent/payments', icon: IconStar, label: 'Payments' },
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
            You have <strong>{pendingActions.length} novedad{pendingActions.length === 1 ? '' : 'es'}</strong> para revisar en el hub familiar.
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
            All caught up. No pending updates in the family hub.
          </p>
        </div>
      )}
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.label} {...kpi} delay={80 + i * 70} />
        ))}
      </div>

      {/* Radar + media */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '320ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Your child's level by category</h2>
              {evaluations.length > 0 ? (
                <Link href="/dashboard/parent/children" className="text-sm text-primary hover:underline">
                  Ver detalle →
                </Link>
              ) : null}
            </div>
            {radarValues.length >= 3 ? (
              <div className="animate-scale-in mx-auto max-w-sm">
                <RadarChart categories={radarCategories} values={radarValues} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconWhistle className="h-7 w-7" />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  When the coach assesses your child, you will see here their technical, physical,
                  tactical and psychological level.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up flex flex-col items-center" style={{ animationDelay: '400ms' }}>
          <CardContent className="flex w-full flex-col items-center gap-4">
            <h2 className="self-start font-semibold">Your child's average rating</h2>
            {overall !== null ? (
              <>
                <DonutChart
                  value={overall * 10}
                  label={`${overall}`}
                  sublabel={`sobre 10 · ${evaluations.length} evaluaciones`}
                />
                <p className="text-center text-sm text-muted-foreground">
                  Media de las evaluaciones registradas por el entrenador.
                </p>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No assessments yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* My children + actividad reciente */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up" style={{ animationDelay: '480ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">My children</h2>
              <Link href="/dashboard/parent/children" className="text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            {children.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Vincula a tu hijo para seguir su desarrollo, evaluaciones y oportunidades.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {children.map(({ player }) => {
                  const positionLabel = player.position
                    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                      player.position)
                    : 'No position';
                  return (
                    <Link
                      key={player.id}
                      href={`/dashboard/parent/children/${player.id}`}
                      className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/50"
                    >
                      <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{positionLabel}</div>
                      </div>
                      <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                        {player.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '560ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Recent activity</h2>
            {recentEvals.length === 0 && recentTrials.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                When there are assessments, trials or opportunities, they will appear here.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {recentEvals.map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconWhistle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {CATEGORY_LABELS[evaluation.category] ?? evaluation.category} ·{' '}
                        {evaluation.player.firstName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {evaluation.evaluatedBy ?? 'Entrenador'} ·{' '}
                        {evaluation.createdAt.toLocaleDateString('es')}
                      </div>
                    </div>
                    <Badge variant="success">{evaluation.score}/10</Badge>
                  </div>
                ))}
                {recentTrials.map((trial) => (
                  <div key={trial.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconStar className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        Prueba · {trial.player.firstName} en {trial.club.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {trial.startsAt.toLocaleDateString('es')} · {trial.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Payments */}
      <Card className="animate-fade-up mt-6" style={{ animationDelay: '640ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Your payments</h2>
            <Link href="/dashboard/parent/payments" className="text-sm text-primary hover:underline">
              Ver historial →
            </Link>
          </div>
          {payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No payments recorded in your account.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IconStar className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {payment.description ?? 'Pago'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {payment.createdAt.toLocaleDateString('es')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {(payment.amount / 100).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: payment.currency.toUpperCase(),
                      })}
                    </div>
                    <Badge variant={payment.status === 'PAID' ? 'success' : 'warning'}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





