import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { TrainingContentDetail } from '@/components/training/content-detail';
import { CompleteContentButton } from '@/components/training/content-actions';
import { playerTrainingAudience, trainingVisibilityWhere } from '@/lib/training';

export const metadata: Metadata = { title: 'Football Center' };

/** Detalle de un curso o ejercicio del Football Center para el jugador. */
export default async function PlayerTrainingDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  // Solo el contenido que le llega (general, de sus coaches o de sus clubes).
  const audience = await playerTrainingAudience(session.user.id);
  const content = await prisma.trainingContent.findFirst({
    where: { id: contentId, AND: [trainingVisibilityWhere(audience)] },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          passScore: true,
          _count: { select: { questions: true } },
        },
      },
      coach: { select: { clubName: true, user: { select: { name: true } } } },
      club: { select: { name: true } },
    },
  });
  if (!content) notFound();

  const attempts =
    content.quiz && audience.playerId
      ? await prisma.quizAttempt.findMany({
          where: { quizId: content.quiz.id, playerId: audience.playerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      : [];
  const best = attempts.reduce((max, attempt) => Math.max(max, attempt.percent), 0);
  const passed = attempts.some((attempt) => attempt.passed);

  const progress = audience.playerId
    ? await prisma.trainingProgress.findUnique({
        where: { playerId_contentId: { playerId: audience.playerId, contentId } },
        select: { completedAt: true },
      })
    : null;

  const authorName =
    content.ownerType === 'COACH'
      ? (content.coach?.clubName ?? content.coach?.user.name ?? null)
      : content.ownerType === 'CLUB'
        ? (content.club?.name ?? null)
        : null;

  return (
    <TrainingContentDetail
      content={{
        id: content.id,
        title: content.title,
        category: content.category,
        kind: content.kind,
        ownerType: content.ownerType,
        description: content.description,
        content: content.content,
        outcomes: content.outcomes,
        videoUrl: content.videoUrl,
        durationMinutes: content.durationMinutes,
        difficulty: content.difficulty,
        series: content.series,
        reps: content.reps,
        restSeconds: content.restSeconds,
        equipment: content.equipment,
        space: content.space,
        players: content.players,
        authorName,
      }}
      backHref="/dashboard/player/training"
      backLabel="Football Center"
      actions={
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  {progress?.completedAt ? 'Completed' : 'Your progress'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {progress?.completedAt
                    ? `Marked as done on ${progress.completedAt.toLocaleDateString('en-GB')}.`
                    : 'Mark this one as done when you finish it.'}
                </p>
              </div>
              <CompleteContentButton
                contentId={content.id}
                completed={Boolean(progress?.completedAt)}
                redirectTo={`/dashboard/player/training/${content.id}`}
              />
            </CardContent>
          </Card>

          {content.quiz ? (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{content.quiz.title} — quiz</h2>
                    <p className="text-xs text-muted-foreground">
                      {content.quiz._count.questions} questions · pass mark {content.quiz.passScore}
                      %
                    </p>
                  </div>
                  {passed ? <Badge variant="success">Passed</Badge> : null}
                </div>
                {attempts.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Best score: <span className="font-semibold text-foreground">{best}%</span> ·{' '}
                    {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Test what you learned and unlock your result.
                  </p>
                )}
                <div>
                  <Link
                    href={`/dashboard/player/training/${content.id}/quiz`}
                    className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950 transition-transform active:scale-[0.99]"
                  >
                    {attempts.length > 0 ? 'Retake quiz' : 'Start quiz'}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      }
    />
  );
}
