'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import type { ActionState } from './auth';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getCoachContext() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.coach.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
}

export async function createCoachLiveSessionAction(formData: FormData): Promise<void> {
  const coach = await getCoachContext();
  if (!coach) return;
  const title = str(formData, 'title');
  if (!title) return;

  await prisma.liveSession.create({
    data: {
      title,
      description: str(formData, 'description'),
      type: (str(formData, 'type') as 'TRAINING' | 'LECTURE' | 'Q_AND_A' | 'TRIAL') ?? 'TRAINING',
      startsAt: parseDate(str(formData, 'startsAt')) ?? new Date(),
      endsAt: parseDate(str(formData, 'endsAt')),
      meetingUrl: str(formData, 'meetingUrl'),
      coachId: coach.id,
    },
  });
  redirect('/dashboard/coach/live-sessions');
}

export async function createEvaluationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const coach = await getCoachContext();
  if (!coach) {
    return { error: 'Invalid session.' };
  }

  const playerId = str(formData, 'playerId');
  const category = str(formData, 'category');
  const notes = str(formData, 'notes');
  const score = Number(formData.get('score'));
  if (!playerId || !category) {
    return { error: 'Invalid data.' };
  }
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return { error: 'The score must be between 1 and 10.' };
  }

  const assigned = await prisma.coachPlayer.findUnique({
    where: { coachId_playerId: { coachId: coach.id, playerId } },
  });
  if (!assigned) {
    return { error: 'The player is not assigned to this coach.' };
  }

  try {
    await prisma.evaluation.create({
      data: {
        playerId,
        category,
        score,
        notes,
        evaluatedBy: coach.user.name,
      },
    });
  } catch {
    return { error: 'Could not register the assessment.' };
  }

  redirect(`/dashboard/coach/players/${playerId}/evaluations`);
}

export async function createGoalAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const coach = await getCoachContext();
  if (!coach) {
    return { error: 'Invalid session.' };
  }

  const playerId = str(formData, 'playerId');
  const title = str(formData, 'title');
  const description = str(formData, 'description');
  const dueDate = str(formData, 'dueDate');
  if (!playerId || !title) {
    return { error: 'Goal title is required.' };
  }

  const assigned = await prisma.coachPlayer.findUnique({
    where: { coachId_playerId: { coachId: coach.id, playerId } },
  });
  if (!assigned) {
    return { error: 'The player is not assigned to this coach.' };
  }

  try {
    await prisma.playerGoal.create({
      data: {
        playerId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
  } catch {
    return { error: 'No se pudo crear el objetivo.' };
  }

  redirect(`/dashboard/coach/players/${playerId}/development`);
}
