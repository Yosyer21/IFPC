import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { CategoryBars, DonutChart, LineChart, RadarChart } from '@/components/player/charts';

export const metadata: Metadata = { title: 'Mi progreso' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  physical: 'Physical',
  tactical: 'Tactics',
  psychological: 'Psychological',
};

export default async function PlayerProgressPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { evaluations: { orderBy: { createdAt: 'asc' } } },
  });
  if (!player) notFound();

  const evaluations = player.evaluations;

  // Overall average
  const overall =
    evaluations.length > 0
      ? Math.round(
          (evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) /
            evaluations.length) *
            10
        ) / 10
      : null;

  // Average by category
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

  const bars = Array.from(byCategory.entries())
    .map(([category, scores]) => ({
      label: CATEGORY_LABELS[category] ?? category,
      value: Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10,
    }))
    .sort((a, b) => b.value - a.value);

  const linePoints = evaluations.map((evaluation, i) => ({
    label: `${i + 1}`,
    value: evaluation.score,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Mi progreso"
        subtitle="Track your development based on your coach and scouts' assessments"
        icon="trending"
      />

      {overall === null ? (
        <Card className="animate-fade-up">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="m3 17 6-6 4 4 8-8" />
                <path d="M15 7h6v6" />
              </svg>
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              No assessment data yet to show your progress. When your coach
              assesses you, you will see here your overall average, the evolution and the breakdown by category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall average + evolution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="animate-fade-up flex flex-col items-center">
              <CardContent className="flex w-full flex-col items-center gap-4">
                <h2 className="self-start font-semibold">Overall average</h2>
                <DonutChart
                  value={overall * 10}
                  label={`${overall}`}
                  sublabel={`sobre 10 · ${evaluations.length} evaluaciones`}
                />
                <div className="flex flex-wrap justify-center gap-2">
                  {bars.map((bar) => (
                    <span
                      key={bar.label}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {bar.label} {bar.value}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '120ms' }}>
              <CardContent>
                <h2 className="mb-2 font-semibold">Score evolution</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Each point is a registered assessment, in chronological order.
                </p>
                <div className="animate-scale-in">
                  <LineChart points={linePoints} gradientId="fb-progress-gradient" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Radar + barras */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="animate-fade-up" style={{ animationDelay: '240ms' }}>
              <CardContent>
                <h2 className="mb-2 font-semibold">Level by category</h2>
                <div className="animate-scale-in mx-auto max-w-xs">
                  <RadarChart categories={radarCategories} values={radarValues} />
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-up" style={{ animationDelay: '320ms' }}>
              <CardContent>
                <h2 className="mb-4 font-semibold">Scores by area</h2>
                {bars.length > 0 ? <CategoryBars items={bars} /> : null}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
