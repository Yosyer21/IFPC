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
    return { error: 'Club no válido.' };
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
    return { error: 'Revisa los datos de la oportunidad.' };
  }

  const { closesAt, ...rest } = parsed.data;
  try {
    await prisma.opportunity.create({
      data: { ...rest, clubId: club.id, closesAt: closesAt ? new Date(closesAt) : null },
    });
  } catch {
    return { error: 'No se pudo crear la oportunidad.' };
  }

  redirect('/dashboard/club/opportunities');
}

export async function createRequirementAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Club no válido.' };
  }

  const title = str(formData, 'title');
  if (!title) {
    return { error: 'El título es obligatorio.' };
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
    return { error: 'No se pudo crear el requisito.' };
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
    return { error: 'Club no válido.' };
  }
  const inquiryId = str(formData, 'inquiryId');
  const response = str(formData, 'response');
  if (!inquiryId || !response) {
    return { error: 'Falta el texto de la respuesta.' };
  }

  try {
    await prisma.inquiry.update({
      where: { id: inquiryId, clubId: club.id },
      data: { response, status: 'CLOSED', respondedAt: new Date() },
    });
  } catch {
    return { error: 'No se pudo guardar la respuesta.' };
  }

  redirect(`/dashboard/club/inquiries/${inquiryId}`);
}

export async function inviteStaffAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const club = await getClub();
  if (!club) {
    return { error: 'Club no válido.' };
  }
  const email = str(formData, 'email');
  const role = str(formData, 'role') ?? 'STAFF';
  if (!email) {
    return { error: 'Email obligatorio.' };
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { error: 'No existe un usuario registrado con ese email.' };
  }

  try {
    await prisma.clubStaff.upsert({
      where: { clubId_userId: { clubId: club.id, userId: user.id } },
      update: { role },
      create: { clubId: club.id, userId: user.id, role },
    });
  } catch {
    return { error: 'No se pudo invitar al miembro.' };
  }

  redirect('/dashboard/club/staff');
}
