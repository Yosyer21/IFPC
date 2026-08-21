import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Mis objetivos' };

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completado',
};

export default async function PlayerGoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { goals: { orderBy: { createdAt: 'desc' } } },
  });
  if (!player) notFound();

  const goals = player.goals;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Mis objetivos</h1>

      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No tienes objetivos definidos todavía.
            </p>
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
                    goal.status === 'completed' ? 'success' : goal.status === 'in_progress' ? 'warning' : 'default'
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
