'use server';

import { redirect } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { playerProfileSchema } from '@future-buller/validation';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ActionState } from './auth';
import { notifyUser } from '@/lib/notifications/notify';

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

export async function updatePlayerProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }

  const parsed = playerProfileSchema.safeParse({
    firstName: str(formData, 'firstName') ?? undefined,
    lastName: str(formData, 'lastName') ?? undefined,
    dateOfBirth: str(formData, 'dateOfBirth') ?? undefined,
    nationality: str(formData, 'nationality'),
    position: str(formData, 'position'),
    foot: str(formData, 'foot'),
    heightCm: num(formData, 'heightCm'),
    weightKg: num(formData, 'weightKg'),
    competitionLevel: str(formData, 'competitionLevel'),
    bio: str(formData, 'bio'),
    clubName: str(formData, 'clubName'),
  });
  if (!parsed.success) {
    return { error: 'Revisa los datos del perfil.' };
  }

  const { dateOfBirth, ...rest } = parsed.data;
  try {
    await prisma.player.update({
      where: { userId: session.user.id },
      data: { ...rest, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null },
    });
  } catch {
    return { error: 'No se pudo guardar el perfil.' };
  }

  redirect('/dashboard/player/profile');
}

export async function updatePlayerStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }

  const status = str(formData, 'status');
  if (!status || !['PENDING_VERIFICATION', 'ACTIVE', 'AVAILABLE', 'INACTIVE'].includes(status)) {
    return { error: 'Estado no válido.' };
  }

  try {
    await prisma.player.update({
      where: { userId: session.user.id },
      data: { status: status as 'AVAILABLE' | 'INACTIVE' | 'ACTIVE' | 'PENDING_VERIFICATION' },
    });
  } catch {
    return { error: 'No se pudo actualizar tu estado.' };
  }

  redirect('/dashboard/player/profile');
}

export async function updateAccountAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }

  const name = str(formData, 'name');
  if (!name) {
    return { error: 'El nombre es obligatorio.' };
  }

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  } catch {
    return { error: 'No se pudo actualizar la cuenta.' };
  }

  redirect('/dashboard/player/settings/account');
}

export async function uploadVideoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }

  const file = formData.get('file');
  const title = str(formData, 'title');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecciona un archivo de vídeo.' };
  }
  if (!title) {
    return { error: 'El título es obligatorio.' };
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return { error: 'Perfil de jugador no encontrado.' };
  }

  const ext = file.name.split('.').pop() ?? 'mp4';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    await prisma.video.create({
      data: {
        playerId: player.id,
        title,
        url: `/uploads/${filename}`,
        status: 'ready',
      },
    });
  } catch {
    return { error: 'No se pudo subir el vídeo.' };
  }

  redirect('/dashboard/player/videos');
}

export async function uploadDocumentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }

  const file = formData.get('file');
  const title = str(formData, 'title');
  const type = str(formData, 'type') ?? 'other';
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecciona un archivo.' };
  }
  if (!title) {
    return { error: 'El título es obligatorio.' };
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return { error: 'Perfil de jugador no encontrado.' };
  }

  const ext = file.name.split('.').pop() ?? 'pdf';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  try {
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    await prisma.document.create({
      data: {
        playerId: player.id,
        title,
        url: `/uploads/documents/${filename}`,
        type,
      },
    });
  } catch {
    return { error: 'No se pudo subir el documento.' };
  }

  redirect('/dashboard/player/documents');
}

export async function applyToOpportunityAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }

  const opportunityId = str(formData, 'opportunityId');
  if (!opportunityId) {
    return { error: 'Oportunidad no válida.' };
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return { error: 'Perfil de jugador no encontrado.' };
  }

  try {
    await prisma.application.upsert({
      where: {
        playerId_opportunityId: { playerId: player.id, opportunityId },
      },
      update: {},
      create: {
        playerId: player.id,
        opportunityId,
        message: str(formData, 'message'),
      },
    });
  } catch {
    return { error: 'No se pudo enviar la solicitud.' };
  }

  // Notificar al club/universidad propietaria de la oportunidad.
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });
    const ownerUserId = opportunity?.clubId
      ? (await prisma.club.findUnique({ where: { id: opportunity.clubId } }))?.userId
      : opportunity?.universityId
        ? (await prisma.university.findUnique({ where: { id: opportunity.universityId } }))?.userId
        : null;
    if (ownerUserId && opportunity) {
      await notifyUser({
        userId: ownerUserId,
        type: 'application',
        title: 'Nueva solicitud recibida',
        message: `${player.firstName} ${player.lastName} ha solicitado participar en "${opportunity.title}".`,
        link: '/dashboard/club/applications',
      });
    }
  } catch {
    // La notificación nunca debe romper la solicitud.
  }

  redirect('/dashboard/player/opportunities/applications');
}

export async function saveOpportunityAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const opportunityId = str(formData, 'opportunityId');
  if (!opportunityId) {
    return;
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return;
  }

  await prisma.savedOpportunity.upsert({
    where: {
      playerId_opportunityId: { playerId: player.id, opportunityId },
    },
    update: {},
    create: { playerId: player.id, opportunityId },
  });

  redirect(`/dashboard/player/opportunities/${opportunityId}`);
}

export async function unsaveOpportunityAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const opportunityId = str(formData, 'opportunityId');
  if (!opportunityId) {
    return;
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return;
  }

  await prisma.savedOpportunity.deleteMany({
    where: { playerId: player.id, opportunityId },
  });

  redirect(`/dashboard/player/opportunities/${opportunityId}`);
}

export async function markNotificationsReadAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
}

export async function registerForCampAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
    return;
  }

  const campId = str(formData, 'campId');
  if (!campId) return;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) return;

  await prisma.campRegistration.upsert({
    where: { playerId_campId: { playerId: player.id, campId } },
    update: { status: 'PENDING' },
    create: { playerId: player.id, campId, status: 'PENDING' },
  });

  redirect(`/camps/${campId}`);
}
