'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { healthAgentProfileSchema } from '@ifpc/validation';
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

/** Valores múltiples ya troceados (checkboxes). */
const values = (formData: FormData, key: string): string[] =>
  formData.getAll(key).filter((value): value is string => typeof value === 'string');

/** Texto libre separado por comas o saltos de línea → lista limpia (máx. 12). */
const commaList = (formData: FormData, key: string): string[] =>
  values(formData, key)
    .flatMap((value) => value.split(/[,\n]/))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);

/**
 * Crea o actualiza el perfil de la práctica del Health Agent autenticado.
 * La verificación (verified / backgroundChecked) NO se toca aquí: es del admin.
 */
export async function updateHealthAgentProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') {
    return { error: 'Invalid health agent.' };
  }

  const parsed = healthAgentProfileSchema.safeParse({
    practiceName: str(formData, 'practiceName') ?? undefined,
    headline: str(formData, 'headline'),
    about: str(formData, 'about'),
    specialties: values(formData, 'specialties'),
    services: commaList(formData, 'services'),
    approach: commaList(formData, 'approach'),
    registrationNumber: str(formData, 'registrationNumber'),
    insuranceProvider: str(formData, 'insuranceProvider'),
    insuranceExpiresAt: str(formData, 'insuranceExpiresAt'),
    priceFrom: num(formData, 'priceFrom'),
    currency: str(formData, 'currency') ?? 'EUR',
    format: str(formData, 'format') ?? 'BOTH',
    sessionsOnline: formData.get('sessionsOnline') === 'on',
    languages: commaList(formData, 'languages'),
    city: str(formData, 'city'),
    country: str(formData, 'country'),
    website: str(formData, 'website') ?? '',
    yearsExperience: num(formData, 'yearsExperience'),
    clientsServed: num(formData, 'clientsServed'),
    availabilityNote: str(formData, 'availabilityNote'),
  });
  if (!parsed.success) {
    return { error: 'Please review the profile: practice name and at least one specialty are required.' };
  }

  const { insuranceExpiresAt, website, ...rest } = parsed.data;
  const expires = insuranceExpiresAt ? new Date(insuranceExpiresAt) : null;
  const data = {
    ...rest,
    website: website ? website : null,
    insuranceExpiresAt: expires && !Number.isNaN(expires.getTime()) ? expires : null,
  };

  try {
    await prisma.healthAgent.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });
  } catch {
    return { error: 'Could not save the profile.' };
  }

  revalidatePaths(
    '/dashboard/health-agent',
    '/dashboard/health-agent/profile',
    '/dashboard/health-agent/id'
  );
  redirect('/dashboard/health-agent/profile?updated=1');
}

/** Publica un hueco de disponibilidad para The "1%" Factor. */
export async function addAvailabilitySlotAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') {
    return { error: 'Invalid health agent.' };
  }
  const agent = await prisma.healthAgent.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) return { error: 'Create your practice profile first.' };

  const startsAtRaw = str(formData, 'startsAt');
  const duration = num(formData, 'durationMinutes') ?? 60;
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
    return { error: 'Pick a future date and time.' };
  }
  if (![30, 45, 60, 90, 120].includes(duration)) return { error: 'Invalid duration.' };

  try {
    await prisma.availabilitySlot.upsert({
      where: { healthAgentId_startsAt: { healthAgentId: agent.id, startsAt } },
      update: { durationMinutes: duration },
      create: { healthAgentId: agent.id, startsAt, durationMinutes: duration },
    });
  } catch {
    return { error: 'Could not save the slot.' };
  }
  revalidatePaths('/dashboard/health-agent/bookings', '/dashboard/player/one-percent');
  return { success: 'Availability published.' };
}

export async function deleteAvailabilitySlotAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') return;
  const slotId = str(formData, 'slotId');
  if (!slotId) redirect('/dashboard/health-agent/bookings');
  const agent = await prisma.healthAgent.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) redirect('/dashboard/health-agent/bookings');
  await prisma.availabilitySlot.deleteMany({ where: { id: slotId, healthAgentId: agent.id } });
  revalidatePaths('/dashboard/health-agent/bookings', '/dashboard/player/one-percent');
  redirect('/dashboard/health-agent/bookings');
}

const CLIENT_PLAN_KINDS = ['NUTRITION', 'PSYCHOLOGY', 'PHYSIOTHERAPY', 'ONE_TO_ONE'] as const;
type ClientPlanKindValue = (typeof CLIENT_PLAN_KINDS)[number];

export async function createClientPlanAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') {
    return { error: 'Invalid health agent.' };
  }
  const agent = await prisma.healthAgent.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) return { error: 'Create your practice profile first.' };

  const playerId = str(formData, 'playerId');
  const kind = str(formData, 'kind');
  const title = str(formData, 'title');
  const totalSteps = num(formData, 'totalSteps') ?? 1;
  if (!playerId || !title || !kind || !(CLIENT_PLAN_KINDS as readonly string[]).includes(kind)) {
    return { error: 'Complete the plan details.' };
  }

  const client = await prisma.booking.findFirst({
    where: {
      healthAgentId: agent.id,
      playerId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    select: { id: true },
  });
  if (!client) return { error: 'That player is not your client yet.' };

  try {
    await prisma.clientPlan.create({
      data: {
        healthAgentId: agent.id,
        playerId,
        kind: kind as ClientPlanKindValue,
        title,
        totalSteps: Math.max(1, Math.min(52, Math.round(totalSteps))),
        currentStep: 1,
        progressPct: 0,
      },
    });
  } catch {
    return { error: 'Could not create the plan.' };
  }
  revalidatePaths('/dashboard/health-agent/bookings');
  return { success: 'Client plan created.' };
}

export async function updateClientPlanProgressAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') return;
  const planId = str(formData, 'planId');
  if (!planId) redirect('/dashboard/health-agent/bookings');
  const agent = await prisma.healthAgent.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) redirect('/dashboard/health-agent/bookings');
  const plan = await prisma.clientPlan.findFirst({
    where: { id: planId, healthAgentId: agent.id },
    select: { id: true, totalSteps: true },
  });
  if (!plan) redirect('/dashboard/health-agent/bookings');

  const progress = num(formData, 'progressPct') ?? 0;
  const step = num(formData, 'currentStep') ?? 1;
  await prisma.clientPlan.update({
    where: { id: plan.id },
    data: {
      progressPct: Math.max(0, Math.min(100, Math.round(progress))),
      currentStep: Math.max(1, Math.min(plan.totalSteps, Math.round(step))),
    },
  });
  revalidatePaths('/dashboard/health-agent/bookings');
  redirect('/dashboard/health-agent/bookings');
}
