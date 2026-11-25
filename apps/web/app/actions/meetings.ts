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

/**
 * "Set up a meeting" del calendario: cualquier perfil autenticado puede crear
 * una reunión propia; aparece automáticamente en su calendario.
 */
export async function createMeetingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Invalid session.' };

  const title = str(formData, 'title');
  const startsAtRaw = str(formData, 'startsAt');
  const duration = num(formData, 'durationMinutes') ?? 30;
  const withWhom = str(formData, 'withWhom');
  const notes = str(formData, 'notes');

  if (!title) return { error: 'Add a title for the meeting.' };
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return { error: 'Pick a date and time.' };
  }
  if (![15, 30, 45, 60, 90].includes(duration)) {
    return { error: 'Invalid duration.' };
  }

  try {
    await prisma.meeting.create({
      data: {
        ownerId: session.user.id,
        title,
        startsAt,
        durationMinutes: duration,
        withWhom: withWhom ?? null,
        notes: notes ?? null,
      },
    });
  } catch {
    return { error: 'Could not create the meeting.' };
  }

  revalidatePaths('/dashboard/calendar', '/dashboard/player/calendar');
  return { success: 'Meeting added to your calendar.' };
}
