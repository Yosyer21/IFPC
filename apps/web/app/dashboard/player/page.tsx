import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { COMPETITION_LEVEL_LABELS, PLAYER_STATUS_LABELS, POSITION_LABELS } from '@ifpc/config';
import { PlayerAvatar } from '@/components/player/avatar';
import { DonutChart, RadarChart } from '@/components/player/charts';
import { CountUp } from '@/components/player/count-up';
import { StatCard } from '@/components/player/stat-card';
import { GOAL_STATUS_LABELS } from '@/lib/labels';
import { canonicalEvaluationCategory, evaluationCategoryLabel } from '@/lib/player-development';
import { playerProfileCompletion } from '@/lib/player';
import { PLAYER_MATCH_THRESHOLD, matchOpportunity } from '@/lib/matching';
import {
  IconMessageCircle,
  IconPlay,
  IconRoute,
  IconTarget,
  IconTrendingUp,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'My area' };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 20) return 'Good afternoon';
  return 'Good evening';
}

export default async function PlayerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!player) notFound();

  const [
    pendingGoals,
    openOpportunities,
    unreadNotifications,
    membership,
    evaluationCount,
    evaluationStats,
    recentEvaluations,
    recentGoals,
  ] = await Promise.all([
    prisma.playerGoal.count({
      where: { playerId: player.id, status: { in: ['pending', 'in_progress'] } },
    }),
    // Only the fields the matching engine needs for the "for you" counter.
    prisma.opportunity.findMany({
      where: { status: 'OPEN' },
      select: { position: true, ageMin: true, ageMax: true },
    }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    prisma.membership.findUnique({ where: { userId: session.user.id } }),
    prisma.evaluation.count({ where: { playerId: player.id } }),
    // Averages per category for the radar without loading every evaluation row.
    prisma.evaluation.groupBy({
      by: ['category'],
      where: { playerId: player.id },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.evaluation.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.playerGoal.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  const statusLabel =
    (PLAYER_STATUS_LABELS as Record<string, string | undefined>)[player.status] ?? player.status;
  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : 'No position defined';
  const competitionLabel = player.competitionLevel
    ? ((COMPETITION_LEVEL_LABELS as Record<string, string | undefined>)[player.competitionLevel] ??
      player.competitionLevel)
    : null;

  const {
    percent,
    completed: completedFields,
    total: totalFields,
  } = playerProfileCompletion(player);

  // Open opportunities whose match score is good enough to apply to.
  const matchedOpportunities = openOpportunities.filter(
    (opportunity) => matchOpportunity(player, opportunity).total >= PLAYER_MATCH_THRESHOLD
  ).length;

  // Media por área para el radar. Se agrupa por categoría **canónica**: los datos
  // heredados en español caen en la misma área y no abren un eje de más.
  const radarAgg = new Map<string, { sum: number; count: number }>();
  for (const stat of evaluationStats) {
    const key = canonicalEvaluationCategory(stat.category) ?? stat.category;
    const count = stat._count._all;
    const current = radarAgg.get(key) ?? { sum: 0, count: 0 };
    current.sum += (stat._avg.score ?? 0) * count;
    current.count += count;
    radarAgg.set(key, current);
  }
  const radarEntries = [...radarAgg.entries()]
    .map(([key, agg]) => ({
      label: evaluationCategoryLabel(key),
      value: Math.round((agg.sum / Math.max(1, agg.count)) * 10) / 10,
    }))
    .sort((a, b) => b.value - a.value);
  const radarCategories = radarEntries.map((entry) => entry.label);
  const radarValues = radarEntries.map((entry) => entry.value);

  const stats = [
    {
      href: '/dashboard/player/development/goals',
      icon: IconTrendingUp,
      label: 'Active goals',
      value: pendingGoals,
    },
    {
      href: '/dashboard/player/development/evaluations',
      icon: IconWhistle,
      label: 'Assessments',
      value: evaluationCount,
    },
    {
      href: '/dashboard/player/opportunities',
      icon: IconTarget,
      label: 'Opportunities for you',
      value: matchedOpportunities,
    },
  ];

  const quickActions = [
    { href: '/dashboard/player/training', icon: IconPlay, label: 'Train' },
    { href: '/dashboard/discovery', icon: IconMessageCircle, label: 'Share on Discovery' },
    { href: '/dashboard/player/opportunities', icon: IconTarget, label: 'Find opportunities' },
    { href: '/dashboard/player/pathway', icon: IconRoute, label: 'My pathway' },
  ];

  const activity = [
    ...recentGoals.map((goal) => ({
      key: goal.id,
      icon: IconTrendingUp,
      title: goal.title,
      meta: `Goal · ${GOAL_STATUS_LABELS[goal.status] ?? goal.status}`,
      date: goal.createdAt,
    })),
    ...recentEvaluations.map((evaluation) => ({
      key: evaluation.id,
      icon: IconWhistle,
      title: evaluationCategoryLabel(evaluation.category),
      meta: `Assessment · ${evaluation.score}/10${
        evaluation.evaluatedBy ? ` · ${evaluation.evaluatedBy}` : ''
      }`,
      date: evaluation.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-5 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:mb-6 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <PlayerAvatar
            firstName={player.firstName}
            lastName={player.lastName}
            imageUrl={player.user.image}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {greeting()}, {player.firstName}
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500 sm:px-2.5 sm:text-xs">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                {statusLabel}
              </span>
              {membership && membership.tier !== 'FREE' ? (
                <Badge variant="success">{membership.tier}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {positionLabel}
              {competitionLabel ? ` · ${competitionLabel}` : ''}
              {player.clubName ? ` · ${player.clubName}` : ''}
              {unreadNotifications > 0 ? ` · ${unreadNotifications} unread notifications` : ''}
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Link
              href="/dashboard/player/profile/edit"
              className="rounded-md border border-border px-3 py-2 text-center text-xs transition-colors hover:bg-muted sm:text-sm"
            >
              Edit profile
            </Link>
            <Link
              href={`/players/${player.id}`}
              className="rounded-md bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-emerald-600 sm:text-sm"
            >
              View public profile
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="animate-fade-up flex items-center justify-center gap-1.5 rounded-lg border border-border/70 px-2.5 py-2 text-center text-xs leading-tight text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground sm:gap-2 sm:px-3 sm:text-sm"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats: en móvil van las tres en una misma línea dentro de una tarjeta; desde
          sm se recuperan las tarjetas de siempre. */}
      <Card className="animate-fade-up mb-5 sm:mb-6 sm:hidden">
        <div className="grid grid-cols-3 divide-x divide-border/60">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.href}
                href={stat.href}
                className="flex flex-col items-center gap-1.5 px-1 text-center"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-lg font-bold leading-none tabular-nums">
                  <CountUp value={stat.value} />
                </span>
                <span className="text-[10.5px] leading-tight text-muted-foreground">
                  {stat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </Card>
      <div className="mb-6 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.href} {...stat} delay={80 + i * 70} />
        ))}
      </div>
      {/* Radar + perfil completado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '320ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Level by category</h2>
              {evaluationCount > 0 ? (
                <Link
                  href="/dashboard/player/development/evaluations"
                  className="text-sm text-primary hover:underline"
                >
                  View assessments →
                </Link>
              ) : null}
            </div>
            {radarValues.length >= 3 ? (
              <div className="animate-scale-in mx-auto max-w-md">
                <RadarChart categories={radarCategories} values={radarValues} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconWhistle className="h-7 w-7" />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  When your coach or scouts assess you, you will see here your technical, physical,
                  tactical and psychological level.
                </p>
                <Link
                  href="/dashboard/player/development/progress"
                  className="text-sm text-primary hover:underline"
                >
                  See my progress →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="animate-fade-up flex flex-col items-center"
          style={{ animationDelay: '400ms' }}
        >
          <CardContent className="flex w-full flex-col items-center gap-4">
            <h2 className="self-start font-semibold">Profile complete</h2>
            <DonutChart
              value={percent}
              label={`${percent}%`}
              sublabel={`${completedFields}/${totalFields} campos`}
            />
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-sm text-muted-foreground">
                {percent === 100
                  ? 'Profile complete! You can now appear in club and scout searches.'
                  : 'Complete your profile to stand out to clubs and scouts.'}
              </p>
              {percent < 100 ? (
                <Link
                  href="/dashboard/player/profile/edit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
                >
                  Complete profile
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="animate-fade-up mt-6" style={{ animationDelay: '480ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link
              href="/dashboard/player/notifications"
              className="text-sm text-primary hover:underline"
            >
              See notifications →
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity yet. Upload a video, apply to an opportunity or train to get started.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{item.meta}</div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.date.toLocaleDateString('en-GB')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
