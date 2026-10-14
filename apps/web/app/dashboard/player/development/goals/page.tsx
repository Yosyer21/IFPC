import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent, Progress } from '@ifpc/ui';

import { NewGoalForm } from '@/components/player/new-goal-form';
import { PageHeader } from '@/components/player/page-header';
import { updateGoalStatusAction } from '@/app/actions/player';
import {
  daysUntil,
  goalStats,
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_PROGRESS,
  isGoalStatus,
} from '@/lib/player-development';

export const metadata: Metadata = { title: 'My goals' };

/** Plazo de una meta en días naturales. */
function dueLabel(dueDate: Date | null): { text: string; urgent: boolean } | null {
  const days = daysUntil(dueDate);
  if (days === null) return null;
  if (days === 0) return { text: 'Due today', urgent: true };
  if (days > 0) return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, urgent: days <= 7 };
  return { text: `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`, urgent: true };
}

export default async function PlayerGoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { goals: { orderBy: { createdAt: 'desc' } } },
  });
  if (!player) notFound();

  const goals = player.goals;
  const stats = goalStats(goals);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My goals"
        subtitle="Move each goal forward as you work on it — your development score follows."
        icon="target"
      />

      {/* Resumen de metas */}
      <Card className="mb-4 animate-fade-up">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Progress</h2>
            <span className="text-sm text-muted-foreground">
              {stats.completed}/{stats.total} completed
              {stats.overdue > 0 ? ` · ${stats.overdue} overdue` : ''}
            </span>
          </div>
          <Progress value={stats.percent} />
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{stats.pending} not started</span>
            <span>{stats.inProgress} in progress</span>
            <span>{stats.completed} completed</span>
          </div>
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <Card className="animate-fade-up mb-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You have no goals yet. Add your first one below: a specific goal with a date is the
              fastest way to grow.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {goals.map((goal, index) => {
            const status = isGoalStatus(goal.status) ? goal.status : 'pending';
            const done = status === 'completed';
            const due = dueLabel(goal.dueDate);
            return (
              <Card
                key={goal.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                    >
                      {done ? (
                        <>
                          <span className="dev-celebrate-ring absolute inset-0 rounded-full" />
                          <span className="dev-celebrate flex h-9 w-9 items-center justify-center rounded-full bg-brand text-ink">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <path d="m6 12.5 4 4 8-9" />
                            </svg>
                          </span>
                        </>
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{goal.title}</h2>
                        <Badge
                          variant={
                            status === 'completed'
                              ? 'success'
                              : status === 'in_progress'
                                ? 'warning'
                                : 'default'
                          }
                        >
                          {GOAL_STATUS_LABELS[status]}
                        </Badge>
                        {due ? (
                          <span
                            className={`text-xs ${due.urgent ? 'text-destructive' : 'text-muted-foreground'}`}
                          >
                            {due.text}
                          </span>
                        ) : null}
                      </div>
                      {goal.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
                      ) : null}
                    </div>
                  </div>

                  <Progress value={GOAL_STATUS_PROGRESS[status] * 100} />

                  {/* Mover la meta: una acción por estado (la actual queda marcada). */}
                  <div className="flex flex-wrap gap-2">
                    {GOAL_STATUSES.map((option) => (
                      <form key={option} action={updateGoalStatusAction}>
                        <input type="hidden" name="goalId" value={goal.id} />
                        <input type="hidden" name="status" value={option} />
                        <button
                          type="submit"
                          disabled={status === option}
                          aria-pressed={status === option}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            status === option
                              ? 'bg-brand text-ink'
                              : 'text-muted-foreground hover:text-brand'
                          }`}
                        >
                          {GOAL_STATUS_LABELS[option]}
                        </button>
                      </form>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="animate-fade-up">
        <CardContent className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold">Add a goal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Yours to own: your coach can see it and help you get there.
            </p>
          </div>
          <NewGoalForm />
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link
          href="/dashboard/player/development"
          className="text-sm text-brand transition-colors hover:underline"
        >
          ← Back to my development
        </Link>
      </div>
    </div>
  );
}
