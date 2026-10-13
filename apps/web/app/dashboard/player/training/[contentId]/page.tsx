import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { TRAINING_CATEGORY_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Course' };

export default async function PlayerTrainingDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const content = await prisma.trainingContent.findUnique({
    where: { id: contentId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          passScore: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });
  if (!content) notFound();

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const attempts =
    content.quiz && player
      ? await prisma.quizAttempt.findMany({
          where: { quizId: content.quiz.id, playerId: player.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      : [];
  const best = attempts.reduce((max, attempt) => Math.max(max, attempt.percent), 0);
  const passed = attempts.some((attempt) => attempt.passed);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/training"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Training
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge>{TRAINING_CATEGORY_LABELS[content.category] ?? content.category}</Badge>
        {content.durationMinutes ? (
          <span className="text-sm text-muted-foreground">{content.durationMinutes} min</span>
        ) : null}
        {content.difficulty ? (
          <span className="text-sm text-muted-foreground">Level {content.difficulty}/5</span>
        ) : null}
      </div>

      <h1 className="text-2xl font-bold">{content.title}</h1>
      {content.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>
      ) : null}

      {content.videoUrl ? (
        <video
          src={content.videoUrl}
          controls
          className="mt-4 aspect-video w-full rounded-lg border border-border bg-black"
        />
      ) : null}

      {content.outcomes.length > 0 ? (
        <Card className="mt-6">
          <CardContent>
            <h2 className="mb-2 font-semibold">What you will learn</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {content.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <span aria-hidden="true" className="text-emerald-400">
                    •
                  </span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {content.content ? (
        <article className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {content.content}
        </article>
      ) : null}

      {content.quiz ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{content.quiz.title} — quiz</h2>
                <p className="text-xs text-muted-foreground">
                  {content.quiz._count.questions} questions · pass mark {content.quiz.passScore}%
                </p>
              </div>
              {passed ? <Badge variant="success">Passed</Badge> : null}
            </div>
            {attempts.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Best score: {' '}
                <span className="font-semibold text-foreground">{best}%</span> · {attempts.length}{' '}
                attempt{attempts.length === 1 ? '' : 's'}
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
    </div>
  );
}
