import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Evaluaciones realizadas' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  physical: 'Físico',
  tactical: 'Táctica',
  psychological: 'Psicológico',
};

export default async function CoachEvaluationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) notFound();

  const playerIds = (
    await prisma.coachPlayer.findMany({ where: { coachId: coach.id }, select: { playerId: true } })
  ).map((assignment) => assignment.playerId);

  const evaluations = await prisma.evaluation.findMany({
    where: { playerId: { in: playerIds } },
    include: { player: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Evaluaciones realizadas"
        subtitle="Todas las evaluaciones que has registrado a tus jugadores"
        icon="whistle"
      />

      {evaluations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no has registrado evaluaciones. Accede a un jugador y usa el formulario de
              evaluación.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {evaluations.map((evaluation) => (
            <Link
              key={evaluation.id}
              href={`/dashboard/coach/players/${evaluation.playerId}/evaluations`}
              className="group"
            >
              <Card className="transition-colors group-hover:border-primary">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">
                      {evaluation.player.firstName} {evaluation.player.lastName}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {CATEGORY_LABELS[evaluation.category] ?? evaluation.category}
                      </span>
                    </h2>
                    {evaluation.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{evaluation.notes}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {evaluation.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                  <Badge variant="success">{evaluation.score}/10</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


