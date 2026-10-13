'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { opportunitySchema } from '@ifpc/validation';
import type { ActionState } from './auth';

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

async function getClub() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.club.findUnique({ where: { userId: session.user.id } });
}

export async function createOpportunityAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }

  const parsed = opportunitySchema.safeParse({
    title: str(formData, 'title') ?? undefined,
    type: str(formData, 'type'),
    position: str(formData, 'position'),
    ageMin: num(formData, 'ageMin'),
    ageMax: num(formData, 'ageMax'),
    location: str(formData, 'location'),
    description: str(formData, 'description'),
    closesAt: str(formData, 'closesAt'),
  });
  if (!parsed.success) {
    return { error: 'Check the opportunity details.' };
  }

  const { closesAt, ...rest } = parsed.data;
  try {
    await prisma.opportunity.create({
      data: { ...rest, clubId: club.id, closesAt: closesAt ? new Date(closesAt) : null },
    });
  } catch {
    return { error: 'The opportunity could not be created.' };
  }

  redirect('/dashboard/club/opportunities');
}

export async function createRequirementAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }

  const title = str(formData, 'title');
  if (!title) {
    return { error: 'Title is required.' };
  }

  try {
    await prisma.requirement.create({
      data: {
        clubId: club.id,
        title,
        position: str(formData, 'position'),
        ageMin: num(formData, 'ageMin'),
        ageMax: num(formData, 'ageMax'),
        level: str(formData, 'level'),
        description: str(formData, 'description'),
      },
    });
  } catch {
    return { error: 'The requirement could not be created.' };
  }

  redirect('/dashboard/club/requirements');
}

export async function closeRequirementAction(formData: FormData): Promise<void> {
  const club = await getClub();
  if (!club) {
    return;
  }
  const requirementId = str(formData, 'requirementId');
  if (!requirementId) {
    return;
  }

  try {
    await prisma.requirement.update({
      where: { id: requirementId, clubId: club.id },
      data: { status: 'CLOSED' },
    });
  } catch {
    return;
  }

  redirect('/dashboard/club/requirements');
}

export async function respondInquiryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }
  const inquiryId = str(formData, 'inquiryId');
  const response = str(formData, 'response');
  if (!inquiryId || !response) {
    return { error: 'The reply text is missing.' };
  }

  try {
    await prisma.inquiry.update({
      where: { id: inquiryId, clubId: club.id },
      data: { response, status: 'CLOSED', respondedAt: new Date() },
    });
  } catch {
    return { error: 'The reply could not be saved.' };
  }

  redirect(`/dashboard/club/inquiries/${inquiryId}`);
}

export async function inviteStaffAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Invalid club.' };
  }
  const email = str(formData, 'email');
  const role = str(formData, 'role') ?? 'STAFF';
  if (!email) {
    return { error: 'Email is required.' };
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { error: 'There is no registered user with that email.' };
  }

  try {
    await prisma.clubStaff.upsert({
      where: { clubId_userId: { clubId: club.id, userId: user.id } },
      update: { role },
      create: { clubId: club.id, userId: user.id, role },
    });
  } catch {
    return { error: 'The member could not be invited.' };
  }

  redirect('/dashboard/club/staff');
}
