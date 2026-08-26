import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PlayerAvatar } from '@/components/player/avatar';
import { DonutChart, RadarChart } from '@/components/player/charts';

export const metadata: Metadata = { title: 'Mi hijo' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  physical: 'Physical',
  tactical: 'Tactics',
  psychological: 'Psychological',
};

const GOAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completed',
};

export default async function ParentChildDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) notFound();

  const link = await prisma.parentChild.findUnique({
    where: { parentId_playerId: { parentId: parent.id, playerId } },
  });
  if (!link) notFound();

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      evaluations: { orderBy: { createdAt: 'desc' } },
      goals: { orderBy: { createdAt: 'desc' }, take: 3 },
      _count: { select: { videos: true } },
    },
  });
  if (!player) notFound();

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

  // Child level by category
  const byCategory = new Map<string, number[]>();
  for (const evaluation of player.evaluations) {
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

  const overall =
    player.evaluations.length > 0
      ? Math.round(
          (player.evaluations.reduce((s, e) => s + e.score, 0) / player.evaluations.length) * 10
        ) / 10
      : null;

  const rows: [string, string][] = [
    ['Position', positionLabel],
    ['Edad', age !== null ? `${age} years old` : '—'],
    ['Nacionalidad', player.nationality ?? '—'],
    ['Club actual', player.clubName ?? '—'],
    ['Estado', player.status],
    ['Videos', String(player._count.videos)],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/parent/children"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← My children
      </Link>

      {/* Hero del hijo */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {player.firstName} {player.lastName}
              </h1>
              <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                {player.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {positionLabel}
              {age !== null ? ` · ${age} years old` : ''}
              {player.clubName ? ` · ${player.clubName}` : ''}
              {overall !== null ? ` · Media ${overall}/10` : ''}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/parent/opportunities"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Ver oportunidades
            </Link>
            <Link
              href="/dashboard/parent/education"
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              Guides for families
            </Link>
          </div>
        </div>
      </section>

      {/* Radar + ficha */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '120ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Nivel de {player.firstName}</h2>
            {radarValues.length >= 3 ? (
              <div className="animate-scale-in mx-auto max-w-sm">
                <RadarChart categories={radarCategories} values={radarValues} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="max-w-xs text-sm text-muted-foreground">
                  Not enough assessments yet to show the level by category.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="animate-fade-up flex flex-col items-center" style={{ animationDelay: '200ms' }}>
            <CardContent className="flex w-full flex-col items-center gap-4">
              <h2 className="self-start font-semibold">Media de {player.firstName}</h2>
              {overall !== null ? (
                <DonutChart
                  value={overall * 10}
                  label={`${overall}`}
                  sublabel={`sobre 10 · ${player.evaluations.length} evaluaciones`}
                />
              ) : (
                <p className="py-8 text-sm text-muted-foreground">No assessments yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '280ms' }}>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Evaluaciones y objetivos recientes */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: '360ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Recent assessments</h2>
            {player.evaluations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No assessments registered yet.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {player.evaluations.slice(0, 4).map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {CATEGORY_LABELS[evaluation.category] ?? evaluation.category}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {evaluation.evaluatedBy ?? 'Entrenador'} ·{' '}
                        {evaluation.createdAt.toLocaleDateString('es')}
                      </div>
                    </div>
                    <Badge variant="success">{evaluation.score}/10</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '440ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Recent goals</h2>
            {player.goals.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No goals assigned yet.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {player.goals.map((goal) => (
                  <div key={goal.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-medium">{goal.title}</div>
                      <Badge
                        variant={
                          goal.status === 'completed'
                            ? 'success'
                            : goal.status === 'in_progress'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {GOAL_STATUS_LABELS[goal.status] ?? goal.status}
                      </Badge>
                    </div>
                    {goal.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {goal.description}
                      </p>
                    ) : null}
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


