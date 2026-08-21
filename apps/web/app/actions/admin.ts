'use server';

import { redirect } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { isRole } from '@future-buller/auth';
import type { PlayerStatus, Role } from '@future-buller/types';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return null;
  return session;
}

export async function verifyPlayerAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const playerId = str(formData, 'playerId');
  const status = str(formData, 'status');
  if (!playerId || !status) return;
  await prisma.player.update({
    where: { id: playerId },
    data: { status: status as PlayerStatus },
  });
  redirect('/dashboard/admin/players');
}

export async function verifyClubAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const clubId = str(formData, 'clubId');
  if (!clubId) return;
  await prisma.club.update({ where: { id: clubId }, data: { verified: true } });
  redirect('/dashboard/admin/clubs');
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const userId = str(formData, 'userId');
  const role = str(formData, 'role');
  if (!userId || !role || !isRole(role)) return;
  await prisma.user.update({ where: { id: userId }, data: { role: role as Role } });
  redirect('/dashboard/admin/users');
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const userId = str(formData, 'userId');
  if (!userId || userId === session.user.id) return;
  await prisma.user.delete({ where: { id: userId } });
  redirect('/dashboard/admin/users');
}

export async function closeOpportunityAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const opportunityId = str(formData, 'opportunityId');
  if (!opportunityId) return;
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { status: 'CLOSED' },
  });
  redirect('/dashboard/admin/opportunities');
}

export async function closeInquiryAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const inquiryId = str(formData, 'inquiryId');
  if (!inquiryId) return;
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: 'CLOSED' },
  });
  redirect('/dashboard/admin/communications/inquiries');
}

export async function createTrainingContentAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const category = str(formData, 'category');
  const title = str(formData, 'title');
  if (!category || !title) return;

  const durationRaw = str(formData, 'durationMinutes');
  const difficultyRaw = str(formData, 'difficulty');
  const durationMinutes = durationRaw ? parseInt(durationRaw, 10) : null;
  const difficulty = difficultyRaw ? parseInt(difficultyRaw, 10) : null;

  await prisma.trainingContent.create({
    data: {
      title,
      category,
      description: str(formData, 'description'),
      videoUrl: str(formData, 'videoUrl'),
      thumbnailUrl: str(formData, 'thumbnailUrl'),
      durationMinutes:
        durationMinutes && Number.isFinite(durationMinutes) ? durationMinutes : null,
      difficulty: difficulty && Number.isFinite(difficulty) ? difficulty : null,
    },
  });
  redirect(`/dashboard/admin/content/${category}`);
}

export async function deleteTrainingContentAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const contentId = str(formData, 'contentId');
  if (!contentId) return;
  const content = await prisma.trainingContent.findUnique({ where: { id: contentId } });
  if (!content) return;
  await prisma.trainingContent.delete({ where: { id: contentId } });
  redirect(`/dashboard/admin/content/${content.category}`);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseIntOrNull(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createCampAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const title = str(formData, 'title');
  if (!title) return;

  await prisma.camp.create({
    data: {
      title,
      description: str(formData, 'description'),
      country: str(formData, 'country'),
      city: str(formData, 'city'),
      startsAt: parseDate(str(formData, 'startsAt')) ?? new Date(),
      endsAt: parseDate(str(formData, 'endsAt')),
      capacity: parseIntOrNull(str(formData, 'capacity')),
      price: parseIntOrNull(str(formData, 'price')),
      status: (str(formData, 'status') as 'DRAFT' | 'OPEN' | 'FULL' | 'CANCELLED' | 'FINISHED') ?? 'DRAFT',
      coachId: str(formData, 'coachId'),
      clubId: str(formData, 'clubId'),
    },
  });
  redirect('/dashboard/admin/camps');
}

export async function changeCampStatusAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const campId = str(formData, 'campId');
  const status = str(formData, 'status');
  if (!campId || !status) return;
  await prisma.camp.update({
    where: { id: campId },
    data: { status: status as 'DRAFT' | 'OPEN' | 'FULL' | 'CANCELLED' | 'FINISHED' },
  });
  redirect('/dashboard/admin/camps');
}

export async function deleteCampAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const campId = str(formData, 'campId');
  if (!campId) return;
  await prisma.camp.delete({ where: { id: campId } });
  redirect('/dashboard/admin/camps');
}

export async function createLiveSessionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const title = str(formData, 'title');
  if (!title) return;

  await prisma.liveSession.create({
    data: {
      title,
      description: str(formData, 'description'),
      type: (str(formData, 'type') as 'TRAINING' | 'LECTURE' | 'Q_AND_A' | 'TRIAL') ?? 'TRAINING',
      status: (str(formData, 'status') as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED') ?? 'SCHEDULED',
      startsAt: parseDate(str(formData, 'startsAt')) ?? new Date(),
      endsAt: parseDate(str(formData, 'endsAt')),
      meetingUrl: str(formData, 'meetingUrl'),
      coachId: str(formData, 'coachId'),
      playerId: str(formData, 'playerId'),
    },
  });
  redirect('/dashboard/admin/live-sessions');
}

export async function changeLiveSessionStatusAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const sessionId = str(formData, 'sessionId');
  const status = str(formData, 'status');
  if (!sessionId || !status) return;
  await prisma.liveSession.update({
    where: { id: sessionId },
    data: { status: status as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' },
  });
  redirect('/dashboard/admin/live-sessions');
}

export async function deleteLiveSessionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const sessionId = str(formData, 'sessionId');
  if (!sessionId) return;
  await prisma.liveSession.delete({ where: { id: sessionId } });
  redirect('/dashboard/admin/live-sessions');
}

export async function createOpportunityAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const title = str(formData, 'title');
  if (!title) return;

  const creatorType = str(formData, 'creatorType') === 'UNIVERSITY' ? 'UNIVERSITY' : 'CLUB';
  const clubId = str(formData, 'clubId');
  const universityId = str(formData, 'universityId');

  await prisma.opportunity.create({
    data: {
      title,
      creatorType,
      clubId: creatorType === 'CLUB' ? clubId : null,
      universityId: creatorType === 'UNIVERSITY' ? universityId : null,
      type: (str(formData, 'type') as 'TRIAL' | 'SCOUTING' | 'CONTRACT' | 'SCHOLARSHIP' | 'ACADEMY') ?? 'TRIAL',
      status: (str(formData, 'status') as 'DRAFT' | 'OPEN' | 'CLOSED') ?? 'OPEN',
      position: str(formData, 'position'),
      ageMin: parseIntOrNull(str(formData, 'ageMin')),
      ageMax: parseIntOrNull(str(formData, 'ageMax')),
      location: str(formData, 'location'),
      description: str(formData, 'description'),
      closesAt: parseDate(str(formData, 'closesAt')),
    },
  });
  redirect('/dashboard/admin/opportunities');
}

export async function updateOpportunityStatusAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const opportunityId = str(formData, 'opportunityId');
  const status = str(formData, 'status');
  if (!opportunityId || !status) return;
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { status: status as 'DRAFT' | 'OPEN' | 'CLOSED' },
  });
  redirect('/dashboard/admin/opportunities');
}

export async function createMessageAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const conversationId = str(formData, 'conversationId');
  const body = str(formData, 'body');
  if (!conversationId || !body) return;
  await prisma.message.create({
    data: { conversationId, senderId: session.user.id, body },
  });
  redirect('/dashboard/admin/communications/messages');
}

export async function markConversationReadAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  const conversationId = str(formData, 'conversationId');
  if (!conversationId) return;
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  redirect('/dashboard/admin/communications/messages');
}

