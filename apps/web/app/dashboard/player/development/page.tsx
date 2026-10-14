import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent, Progress } from '@ifpc/ui';

import { DonutChart, RadarChart } from '@/components/player/charts';
import { PageHeader } from '@/components/player/page-header';
import {
  IconCheckCircle,
  IconRoute,
  IconTarget,
  IconTrendingUp,
  IconTrophy,
  IconVideo,
} from '@/components/dashboard/icons';
import { formatRelativeTime } from '@/lib/discovery-content';
import { playerProfileCompletion } from '@/lib/player';
import {
  daysUntil,
  developmentScore,
  developmentTimeline,
  evaluationSummary,
  goalStats,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_PROGRESS,
  isGoalStatus,
  type DevelopmentEventKind,
} from '@/lib/player-development';

export const metadata: Metadata = { title: 'My development' };

/** Icono de cada tipo de hito del timeline. */
const EVENT_ICONS: Record<DevelopmentEventKind, typeof IconTarget> = {
  assessment: IconTarget,
  goal: IconCheckCircle,
  career: IconTrophy,
  training: IconVideo,
};

/** Texto del plazo de una meta («Due in 5 days», «3 days overdue»…). */
function dueLabel(dueDate: Date | null): { text: string; urgent: boolean } | null {
  const days = daysUntil(dueDate);
  if (days === null) return null;
  if (days === 0) return { text: 'Due today', urgent: true };
  if (days > 0) return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, urgent: days <= 7 };
  return { text: `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`, urgent: true };
}

export default async function PlayerDevelopmentPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const [evaluations, goals, training, career] = await Promise.all([
    prisma.evaluation.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, category: true, score: true, createdAt: true },
    }),
    prisma.playerGoal.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.trainingProgress.findMany({
      where: { playerId: player.id },
      orderBy: { completedAt: 'desc' },
      take: 20,
      select: { id: true, completedAt: true, content: { select: { title: true } } },
    }),
    prisma.careerEntry.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, clubName: true, season: true, createdAt: true },
    }),
  ]);

  const { percent: profilePercent } = playerProfileCompletion(player);
  const score = developmentScore({ profilePercent, evaluations, goals, training });
  const areas = evaluationSummary(evaluations);
  const goalState = goalStats(goals);
  const timeline = developmentTimeline({
    evaluations,
    goals,
    career,
    training: training.map((item) => ({
      id: item.id,
      title: item.content.title,
      completedAt: item.completedAt,
    })),
  });

  const openGoals = goals.filter((goal) => goal.status !== 'completed').slice(0, 3);
  const trend = score.trend;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My development"
        subtitle="Your evolution as a player: profile, goals, assessments and progress"
        icon="trending"
      />

      {/* 1. Puntuación de desarrollo (sustituye al «%» que no medía nada) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up flex flex-col items-center">
          <CardContent className="flex w-full flex-col items-center gap-4">
            <h2 className="self-start font-semibold">Development score</h2>
            <DonutChart value={score.score} label={`${score.score}`} sublabel="out of 100" />
            {trend === null ? (
              <p className="text-center text-xs text-muted-foreground">
                Two months of assessments are needed to show the trend.
              </p>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  trend >= 0 ? 'bg-brand/15 text-brand' : 'bg-destructive/15 text-destructive'
                }`}
              >
                <IconTrendingUp className={`h-3.5 w-3.5 ${trend < 0 ? 'rotate-180' : ''}`} />
                {trend >= 0 ? '+' : ''}
                {trend} in 30 days
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '120ms' }}>
          <CardContent className="flex flex-col gap-4">
            <h2 className="font-semibold">What builds your score</h2>
            <div className="flex flex-col gap-3.5">
              {score.factors.map((factor, index) => (
                <div
                  key={factor.key}
                  className="dev-factor"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{factor.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {factor.points}/{factor.weight}
                    </span>
                  </div>
                  <Progress value={(factor.points / factor.weight) * 100} />
                </div>
              ))}
            </div>

            {score.next ? (
              <Link
                href={score.next.href}
                className="flex items-center gap-3 rounded-xl bg-brand/10 px-4 py-3 transition-colors hover:bg-brand/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
                  <IconTarget className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-brand">
                    Next best step
                  </span>
                  <span className="block text-sm">{score.next.hint}</span>
                </span>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* 2. Áreas evaluadas + 3. Línea temporal */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <CardContent>
            <h2 className="mb-2 font-semibold">Level by area</h2>
            {areas.byCategory.length >= 3 ? (
              <>
                <div className="animate-scale-in mx-auto max-w-md">
                  <RadarChart
                    categories={areas.byCategory.map((area) => area.label)}
                    values={areas.byCategory.map((area) => area.value)}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  {areas.strongest ? (
                    <p className="flex items-center gap-2">
                      <Badge variant="success">Strongest</Badge>
                      {areas.strongest.label} · {areas.strongest.value}/10
                    </p>
                  ) : null}
                  {areas.weakest ? (
                    <p className="flex items-center gap-2">
                      <Badge variant="warning">To work on</Badge>
                      {areas.weakest.label} · {areas.weakest.value}/10
                    </p>
                  ) : null}
                </div>
                <Link
                  href="/dashboard/player/development/progress"
                  className="mt-4 inline-block text-sm font-medium text-brand transition-colors hover:underline"
                >
                  See full progress →
                </Link>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Your coach has not assessed you yet. When they do, your level by area will appear
                here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '280ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Development timeline</h2>
            {timeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No milestones yet. Set a goal, complete training or get assessed to start your
                timeline.
              </p>
            ) : (
              <ol className="relative flex flex-col gap-4">
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 left-[15px] top-2 w-px bg-border"
                />
                {timeline.map((event, index) => {
                  const EventIcon = EVENT_ICONS[event.kind];
                  return (
                    <li
                      key={event.id}
                      className="dev-event relative flex items-start gap-3"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <span
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-ink text-brand ${
                          event.celebrate ? 'dev-dot-glow' : ''
                        }`}
                      >
                        <EventIcon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {event.href ? (
                          <Link
                            href={event.href}
                            className="block truncate text-sm font-medium transition-colors hover:text-brand"
                          >
                            {event.title}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium">{event.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {event.detail ? `${event.detail} · ` : ''}
                          {formatRelativeTime(event.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Metas: progreso, plazo y estado */}
      <Card className="animate-fade-up mt-6" style={{ animationDelay: '320ms' }}>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Goals</h2>
            <span className="text-sm text-muted-foreground">
              {goalState.completed}/{goalState.total} completed · {goalState.percent}% average
              {goalState.overdue > 0 ? ` · ${goalState.overdue} overdue` : ''}
            </span>
          </div>

          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no goals yet. Set the first one from the goals page and it will show up here.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {openGoals.map((goal) => {
                const status = isGoalStatus(goal.status) ? goal.status : 'pending';
                const due = dueLabel(goal.dueDate);
                return (
                  <div key={goal.id} className="rounded-xl border border-border p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <Badge
                          variant={
                            status === 'in_progress'
                              ? 'warning'
                              : status === 'completed'
                                ? 'success'
                                : 'default'
                          }
                        >
                          {GOAL_STATUS_LABELS[status]}
                        </Badge>
                        {due ? (
                          <span
                            className={due.urgent ? 'text-destructive' : 'text-muted-foreground'}
                          >
                            {due.text}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <Progress value={GOAL_STATUS_PROGRESS[status] * 100} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/dashboard/player/development/goals"
              className="text-sm font-medium text-brand transition-colors hover:underline"
            >
              Manage my goals →
            </Link>
            <Link
              href="/dashboard/player/development/evaluations"
              className="text-sm font-medium text-brand transition-colors hover:underline"
            >
              My assessments ({areas.count}) →
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/dashboard/player/training"
          className="text-sm text-brand transition-colors hover:underline"
        >
          → Continue training
        </Link>
        <Link
          href="/dashboard/player/pathway"
          className="text-sm text-brand transition-colors hover:underline"
        >
          → View my development pathway
        </Link>
      </div>
    </div>
  );
}
