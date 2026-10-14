import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@ifpc/ui';
import { CreateEvaluationForm } from '@/components/coach/create-evaluation-form';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Player evaluations' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  physical: 'Physical',
  tactical: 'Tactics',
  psychological: 'Psychological',
};

export default async function CoachPlayerEvaluationsPage({
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

  const [player, evaluations] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.evaluation.findMany({
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
        title="Assessments"
        subtitle={`Assessments recorded for ${player.firstName} ${player.lastName}`}
        icon="whistle"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Register assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEvaluationForm playerId={playerId} />
        </CardContent>
      </Card>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No evaluations recorded.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="font-semibold">
                      {CATEGORY_LABELS[evaluation.category] ?? evaluation.category}
                    </h2>
                    {evaluation.evaluatedBy ? (
                      <span className="text-xs text-muted-foreground">
                        by {evaluation.evaluatedBy}
                      </span>
                    ) : null}
                  </div>
                  {evaluation.notes ? (
                    <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {evaluation.createdAt.toLocaleDateString('en-GB')}
                  </p>
                </div>
                <Badge variant="success">{evaluation.score}/10</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


