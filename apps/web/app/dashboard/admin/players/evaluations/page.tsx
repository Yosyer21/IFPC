import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CategoryBars } from '@/components/player/charts';
import { IconTrendingUp, IconWhistle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Evaluaciones' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  physical: 'Físico',
  tactical: 'Táctica',
  psychological: 'Psicológica',
};

export default async function AdminPlayersEvaluationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const evaluations = await prisma.evaluation.findMany({
    include: { player: true },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });

  const total = evaluations.length;
  const average =
    total > 0 ? evaluations.reduce((sum, e) => sum + e.score, 0) / total : 0;
  const excellent = evaluations.filter((e) => e.score >= 8).length;

  const byCategory = Object.keys(CATEGORY_LABELS).map((category) => {
    const list = evaluations.filter((e) => e.category === category);
    const avg =
      list.length > 0 ? list.reduce((sum, e) => sum + e.score, 0) / list.length : 0;
    return {
      label: CATEGORY_LABELS[category] ?? category,
      value: Number(avg.toFixed(1)),
    };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Evaluaciones"
        subtitle="Valoraciones de jugadores registradas por los coaches"
        icon="whistle"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          href="/dashboard/admin/players"
          icon={IconWhistle}
          label="Evaluaciones totales"
          value={total}
        />
        <StatCard
          href="/dashboard/admin/players"
          icon={IconTrendingUp}
          label="Media global"
          value={Number(average.toFixed(1))}
          suffix="/10"
        />
        <StatCard
          href="/dashboard/admin/players"
          icon={IconTrendingUp}
          label="Notas destacadas (8+)"
          value={excellent}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Media por categoría</h2>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground">No hay evaluaciones registradas.</p>
            ) : (
              <CategoryBars items={byCategory} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Recientes ({evaluations.length})</h2>
            {evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin evaluaciones.</p>
            ) : (
              <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                {evaluations.slice(0, 50).map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="rounded-md border border-border p-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {evaluation.player.firstName} {evaluation.player.lastName}
                      </span>
                      <Badge variant={evaluation.score >= 8 ? 'success' : 'default'}>
                        {evaluation.score}/10
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[evaluation.category] ?? evaluation.category} ·{' '}
                      {evaluation.createdAt.toLocaleDateString('es')}
                    </p>
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
