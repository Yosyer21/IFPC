import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  quizFindUnique: vi.fn(),
  playerFindUnique: vi.fn(),
  attemptCreate: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    quiz: { findUnique: mocks.quizFindUnique },
    player: { findUnique: mocks.playerFindUnique },
    quizAttempt: { create: mocks.attemptCreate },
  },
}));

import { submitQuizAttemptAction } from '@/app/actions/quiz';

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const quiz = {
  id: 'quiz-1',
  contentId: 'tc-tech-1',
  passScore: 70,
  questions: [
    {
      id: 'q1',
      options: [
        { id: 'q1-correct', isCorrect: true },
        { id: 'q1-wrong', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      options: [
        { id: 'q2-correct', isCorrect: true },
        { id: 'q2-wrong', isCorrect: false },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.quizFindUnique.mockResolvedValue(quiz);
  mocks.playerFindUnique.mockResolvedValue({ id: 'player-1' });
  mocks.attemptCreate.mockResolvedValue({ id: 'attempt-1' });
});

describe('submitQuizAttemptAction', () => {
  it('scores the answers on the server and stores the attempt', async () => {
    const redirectTo = await captureRedirect(() =>
      submitQuizAttemptAction(
        form({ contentId: 'tc-tech-1', 'answer-q1': 'q1-correct', 'answer-q2': 'q2-wrong' })
      )
    );

    expect(mocks.attemptCreate).toHaveBeenCalledTimes(1);
    const data = mocks.attemptCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({
      quizId: 'quiz-1',
      playerId: 'player-1',
      correct: 1,
      total: 2,
      percent: 50,
      passed: false,
    });
    expect(data.answers.create).toEqual([
      { questionId: 'q1', optionId: 'q1-correct', isCorrect: true },
      { questionId: 'q2', optionId: 'q2-wrong', isCorrect: false },
    ]);
    expect(redirectTo).toBe('/dashboard/player/training/tc-tech-1/quiz?result=attempt-1');
  });

  it('passes when the score meets the pass mark', async () => {
    await captureRedirect(() =>
      submitQuizAttemptAction(
        form({ contentId: 'tc-tech-1', 'answer-q1': 'q1-correct', 'answer-q2': 'q2-correct' })
      )
    );
    expect(mocks.attemptCreate.mock.calls[0][0].data).toMatchObject({
      correct: 2,
      percent: 100,
      passed: true,
    });
  });

  it('treats a missing answer as incorrect', async () => {
    await captureRedirect(() =>
      submitQuizAttemptAction(form({ contentId: 'tc-tech-1', 'answer-q1': 'q1-correct' }))
    );
    expect(mocks.attemptCreate.mock.calls[0][0].data).toMatchObject({ correct: 1, percent: 50 });
  });

  it('redirects to login without a session', async () => {
    mocks.auth.mockResolvedValue(null);
    const redirectTo = await captureRedirect(() =>
      submitQuizAttemptAction(form({ contentId: 'tc-tech-1' }))
    );
    expect(mocks.attemptCreate).not.toHaveBeenCalled();
    expect(redirectTo).toBe('/login');
  });
});
