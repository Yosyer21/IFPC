'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { revalidatePaths } from '@/lib/revalidate';
import { announceLiveInDiscovery } from '@/lib/live-sessions';

type LiveType = 'TRAINING' | 'LECTURE' | 'Q_AND_A' | 'TRIAL';
type Visibility = 'CLUB' | 'PUBLIC';

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function dateField(formData: FormData, key: string): Date | null {
  const value = str(formData, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Club organiza un live. `visibility = PUBLIC` además lo anuncia en Discovery. */
export async function createClubLiveSessionAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'CLUB') redirect('/login');

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) redirect('/dashboard/club');

  const title = str(formData, 'title');
  const startsAt = dateField(formData, 'startsAt');
  if (!title || !startsAt) redirect('/dashboard/club/live-sessions');

  const visibility: Visibility = str(formData, 'visibility') === 'PUBLIC' ? 'PUBLIC' : 'CLUB';

  const liveSession = await prisma.liveSession.create({
    data: {
      title,
      description: str(formData, 'description'),
      type: (str(formData, 'type') as LiveType) ?? 'TRAINING',
      status: 'SCHEDULED',
      visibility,
      startsAt,
      endsAt: dateField(formData, 'endsAt'),
      meetingUrl: str(formData, 'meetingUrl'),
      clubId: club.id,
    },
  });

  if (visibility === 'PUBLIC') {
    await announceLiveInDiscovery(liveSession);
  }

  revalidatePaths('/dashboard/club/live-sessions', '/dashboard/discovery');
  redirect('/dashboard/club/live-sessions');
}

/** Elimina un live del club (y su anuncio en Discovery, si lo tuviera). */
export async function deleteClubLiveSessionAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'CLUB') redirect('/login');

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  const sessionId = str(formData, 'sessionId');
  if (!club || !sessionId) redirect('/dashboard/club/live-sessions');

  const liveSession = await prisma.liveSession.findUnique({ where: { id: sessionId } });
  if (!liveSession || liveSession.clubId !== club.id) redirect('/dashboard/club/live-sessions');

  await prisma.post.deleteMany({ where: { liveSessionId: sessionId } });
  await prisma.liveSession.delete({ where: { id: sessionId } });

  revalidatePaths('/dashboard/club/live-sessions', '/dashboard/discovery');
  redirect('/dashboard/club/live-sessions');
}
