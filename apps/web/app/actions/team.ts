'use server';

import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import type { ActionState } from './auth';
import { revalidatePaths } from '@/lib/revalidate';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const num = (formData: FormData, key: string): number | null => {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Coach o club que crea el evento (dueño en el calendario). */
async function teamAuthor(): Promise<{ coachId: string | null; clubId: string | null } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return coach ? { coachId: coach.id, clubId: null } : null;
  }
  if (session.user.role === 'CLUB') {
    const club = await prisma.club.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return club ? { coachId: null, clubId: club.id } : null;
  }
  return null;
}

export async function createMatchAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const author = await teamAuthor();
  if (!author) return { error: 'Only coaches and clubs can add matches.' };

  const opponent = str(formData, 'opponent');
  const startsAtRaw = str(formData, 'startsAt');
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  if (!opponent) return { error: 'Add the opponent.' };
  if (!startsAt || Number.isNaN(startsAt.getTime())) return { error: 'Pick a date and time.' };

  try {
    await prisma.match.create({
      data: {
        ...author,
        opponent,
        startsAt,
        venue: str(formData, 'venue'),
        home: formData.get('home') === 'on',
        ourScore: num(formData, 'ourScore'),
        opponentScore: num(formData, 'opponentScore'),
        notes: str(formData, 'notes'),
      },
    });
  } catch {
    return { error: 'Could not save the match.' };
  }

  revalidatePaths('/dashboard/calendar', '/dashboard/coach/team');
  return { success: 'Match added to the calendar.' };
}

export async function createTrainingEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const author = await teamAuthor();
  if (!author) return { error: 'Only coaches and clubs can add training events.' };

  const title = str(formData, 'title');
  const startsAtRaw = str(formData, 'startsAt');
  const duration = num(formData, 'durationMinutes') ?? 60;
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  if (!title) return { error: 'Add a title.' };
  if (!startsAt || Number.isNaN(startsAt.getTime())) return { error: 'Pick a date and time.' };
  if (![30, 45, 60, 90, 120].includes(duration)) return { error: 'Invalid duration.' };

  try {
    await prisma.trainingEvent.create({
      data: {
        ...author,
        title,
        startsAt,
        durationMinutes: duration,
        location: str(formData, 'location'),
        notes: str(formData, 'notes'),
      },
    });
  } catch {
    return { error: 'Could not save the training.' };
  }

  revalidatePaths('/dashboard/calendar', '/dashboard/coach/team');
  return { success: 'Training added to the calendar.' };
}
