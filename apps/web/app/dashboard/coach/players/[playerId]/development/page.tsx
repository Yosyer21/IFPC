import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@ifpc/ui';
import { CreateGoalForm } from '@/components/coach/create-goal-form';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Objetivos del jugador' };

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completado',
};

export default async function CoachPlayerDevelopmentPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) notFound();

  const assignment = await prisma.coachPlayer.findUnique({
    where: { coachId_playerId: { coachId: coach.id, playerId } },
  });
  if (!assignment) notFound();

  const [player, goals] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.playerGoal.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/dashboard/coach/players/${playerId}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← {player.firstName} {player.lastName}
      </Link>
      <PageHeader
        title="Objetivos de desarrollo"
        subtitle={`Objetivos asignados a ${player.firstName} ${player.lastName}`}
        icon="trending"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nuevo objetivo</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateGoalForm playerId={playerId} />
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay objetivos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-base">{goal.title}</CardTitle>
                <Badge
                  variant={
                    goal.status === 'completed'
                      ? 'success'
                      : goal.status === 'in_progress'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {STATUS_LABELS[goal.status] ?? goal.status}
                </Badge>
              </CardHeader>
              <CardContent>
                {goal.description ? (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                ) : null}
                {goal.dueDate ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Fecha límite: {goal.dueDate.toLocaleDateString('es')}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


