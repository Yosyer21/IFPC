'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';

/**
 * Corrige el quiz de un curso y guarda el intento del jugador.
 * El navegador envía `answer-<questionId> = <optionId>`; la corrección se hace
 * **en el servidor** comparando con la opción marcada como correcta.
 */
export async function submitQuizAttemptAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const contentId = String(formData.get('contentId') ?? '');
  const quiz = await prisma.quiz.findUnique({
    where: { contentId },
    include: { questions: { include: { options: true } } },
  });
  if (!quiz) redirect('/dashboard/player/training');

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) redirect(`/dashboard/player/training/${contentId}`);

  const answers = quiz.questions.map((question) => {
    const optionId = String(formData.get(`answer-${question.id}`) ?? '');
    const correctOption = question.options.find((option) => option.isCorrect);
    const isCorrect = Boolean(optionId) && optionId === correctOption?.id;
    return { questionId: question.id, optionId: optionId || null, isCorrect };
  });

  const correct = answers.filter((answer) => answer.isCorrect).length;
  const total = quiz.questions.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  const passed = percent >= quiz.passScore;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      playerId: player.id,
      correct,
      total,
      percent,
      passed,
      answers: { create: answers },
    },
  });

  redirect(`/dashboard/player/training/${contentId}/quiz?result=${attempt.id}`);
}
