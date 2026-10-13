import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { submitQuizAttemptAction } from '@/app/actions/quiz';

export const metadata: Metadata = { title: 'Quiz' };

export default async function PlayerQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ contentId: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { contentId } = await params;
  const { result } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const content = await prisma.trainingContent.findUnique({
    where: { id: contentId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: { options: { orderBy: { position: 'asc' } } },
          },
        },
      },
    },
  });
  if (!content || !content.quiz) notFound();
  const quiz = content.quiz;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) redirect(`/dashboard/player/training/${contentId}`);

  const attempt = result
    ? await prisma.quizAttempt.findUnique({
        where: { id: result },
        include: { answers: true },
      })
    : null;
  const reviewed =
    attempt && attempt.playerId === player.id && attempt.quizId === quiz.id ? attempt : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/player/training/${contentId}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← {content.title}
      </Link>
      <h1 className="text-2xl font-bold">{quiz.title} — quiz</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'} · pass mark{' '}
        {quiz.passScore}%
        {quiz.description ? ` · ${quiz.description}` : ''}
      </p>

      {reviewed ? (
        <div className="mt-6 flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-black">{reviewed.percent}%</p>
                <p className="text-sm text-muted-foreground">
                  {reviewed.correct} of {reviewed.total} correct
                </p>
              </div>
              <Badge variant={reviewed.passed ? 'success' : 'danger'}>
                {reviewed.passed ? 'Passed' : 'Not passed'}
              </Badge>
            </CardContent>
          </Card>

          {quiz.questions.map((question, index) => {
            const answer = reviewed.answers.find((item) => item.questionId === question.id);
            const correctOption = question.options.find((option) => option.isCorrect);
            const chosen = question.options.find((option) => option.id === answer?.optionId);
            return (
              <Card key={question.id}>
                <CardContent className="flex flex-col gap-1.5">
                  <p className="font-medium">
                    {index + 1}. {question.prompt}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your answer:{' '}
                    <span className={answer?.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                      {chosen?.label ?? 'No answer'}
                    </span>
                  </p>
                  {answer?.isCorrect ? null : (
                    <p className="text-sm text-muted-foreground">
                      Correct answer:{' '}
                      <span className="text-emerald-400">{correctOption?.label}</span>
                    </p>
                  )}
                  {question.explanation ? (
                    <p className="text-xs text-muted-foreground">{question.explanation}</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/player/training/${contentId}/quiz`}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
            >
              Retake quiz
            </Link>
            <Link
              href="/dashboard/player/training"
              className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950"
            >
              Back to training
            </Link>
          </div>
        </div>
      ) : (
        <form action={submitQuizAttemptAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="contentId" value={content.id} />
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="flex flex-col gap-2">
                <p className="font-medium">
                  {index + 1}. {question.prompt}
                </p>
                <div className="flex flex-col gap-1">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name={`answer-${question.id}`}
                        value={option.id}
                        required
                        className="h-4 w-4"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          <div>
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-transform active:scale-[0.99]"
            >
              Submit answers
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
