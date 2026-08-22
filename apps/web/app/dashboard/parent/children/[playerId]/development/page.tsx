import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { DonutChart, RadarChart } from '@/components/player/charts';
import { IconRoute, IconStar, IconTarget, IconVideo } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Desarrollo de mi hijo' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  physical: 'Físico',
  tactical: 'Táctica',
  psychological: 'Psicológica',
};

const GOAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completado',
};

export default async function ParentChildDevelopmentPage({
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
      goals: { orderBy: { createdAt: 'desc' } },
      pathway: true,
      _count: { select: { videos: true } },
    },
  });
  if (!player) notFound();

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
        )
      : 0;
  const completedGoals = player.goals.filter((g) => g.status === 'completed').length;
  const progress =
    player.goals.length > 0 ? Math.round((completedGoals / player.goals.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={`Desarrollo · ${player.firstName}`}
        subtitle="Evolución deportiva, evaluaciones y objetivos"
        icon="trending"
      >
        <Link
          href={`/dashboard/parent/children/${player.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mi hijo
        </Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard href={`/dashboard/parent/children/${player.id}/development`} icon={IconStar} label="Nivel global" value={overall} suffix="/10" />
        <StatCard href={`/dashboard/parent/children/${player.id}/development`} icon={IconTarget} label="Objetivos completados" value={completedGoals} />
        <StatCard href={`/dashboard/parent/children/${player.id}/development`} icon={IconRoute} label="Objetivos totales" value={player.goals.length} />
        <StatCard href={`/dashboard/parent/children/${player.id}/development`} icon={IconVideo} label="Vídeos" value={player._count.videos} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Nivel por categoría</h2>
            {radarCategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay evaluaciones de tu hijo.
              </p>
            ) : (
              <div className="mx-auto max-w-xs">
                <RadarChart categories={radarCategories} values={radarValues} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Progreso de objetivos</h2>
            <div className="flex flex-col items-center gap-4">
              <DonutChart value={progress} label={`${progress}%`} sublabel="completados" />
              <p className="text-sm text-muted-foreground">
                {completedGoals} de {player.goals.length} objetivos completados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PATHWAY_SECTION */}
      {player.pathway ? (
        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Ruta de desarrollo</h2>
              <Badge variant={player.pathway.status === 'completed' ? 'success' : 'warning'}>
                {player.pathway.status}
              </Badge>
            </div>
            <h3 className="mt-3 font-medium">{player.pathway.title}</h3>
            {player.pathway.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{player.pathway.description}</p>
            ) : null}
            {player.pathway.goals ? (
              <p className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
                {player.pathway.goals}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {player.pathway.level ? (
                <Badge variant="outline">Nivel: {player.pathway.level}</Badge>
              ) : null}
              {player.pathway.focus ? (
                <Badge variant="outline">Foco: {player.pathway.focus}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* GOALS_SECTION */}
      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Objetivos ({player.goals.length})</h2>
          {player.goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tu hijo aún no tiene objetivos asignados.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {player.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{goal.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {goal.description ?? 'Sin descripción'}
                      {goal.dueDate ? ` · Vence: ${goal.dueDate.toLocaleDateString('es')}` : ''}
                    </div>
                  </div>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


