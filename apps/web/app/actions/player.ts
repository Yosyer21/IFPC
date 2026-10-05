'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { PLAYER_STATUSES, type PlayerStatus } from '@ifpc/config';
import { prisma } from '@ifpc/database';
import { playerProfileSchema } from '@ifpc/validation';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
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
    return { error: 'Invalid session.' };
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
    return { error: 'Please review the profile data.' };
  }

  const { dateOfBirth, ...rest } = parsed.data;
  try {
    await prisma.player.update({
      where: { userId: session.user.id },
      data: { ...rest, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null },
    });
  } catch {
    return { error: 'Could not save the profile.' };
  }

  redirect('/dashboard/player/profile');
}

export async function updatePlayerStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const status = str(formData, 'status');
  if (!status || !PLAYER_STATUSES.some((value) => value === status)) {
    return { error: 'Invalid status.' };
  }

  try {
    await prisma.player.update({
      where: { userId: session.user.id },
      data: { status: status as PlayerStatus },
    });
  } catch {
    return { error: 'Could not update your status.' };
  }

  redirect('/dashboard/player/profile');
}

export async function updateAccountAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const name = str(formData, 'name');
  if (!name) {
    return { error: 'Name is required.' };
  }

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  } catch {
    return { error: 'Could not update the account.' };
  }

  redirect('/dashboard/player/settings/account');
}

export async function uploadVideoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const file = formData.get('file');
  const title = str(formData, 'title');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Select a video file.' };
  }
  if (!title) {
    return { error: 'Title is required.' };
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return { error: 'Profile de jugador no encontrado.' };
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
    return { error: 'Could not upload the video.' };
  }

  redirect('/dashboard/player/videos');
}

export async function uploadDocumentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const file = formData.get('file');
  const title = str(formData, 'title');
  const type = str(formData, 'type') ?? 'other';
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecciona un archivo.' };
  }
  if (!title) {
    return { error: 'Title is required.' };
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return { error: 'Profile de jugador no encontrado.' };
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

/** Accepted profile photo types mapped to the extension we store them with. */
const PHOTO_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Absolute directory holding profile photos inside the public uploads folder. */
const PHOTO_DIR = path.join(process.cwd(), 'public', 'uploads', 'photos');

/** Best-effort removal of a previously uploaded local photo (never throws). */
async function removeLocalPhoto(image: string | null): Promise<void> {
  if (!image?.startsWith('/uploads/photos/')) return;
  try {
    await unlink(path.join(process.cwd(), 'public', image.replace(/^\//, '')));
  } catch {
    // The file may already be gone: nothing to clean up.
  }
}

/**
 * Uploads/replaces the profile photo of the signed-in user (`User.image`), the
 * same field the shared `PlayerAvatar` renders.
 */
export async function updatePlayerPhotoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecciona una imagen.' };
  }
  const ext = PHOTO_MIME_EXT[file.type];
  if (!ext) {
    return { error: 'Only JPG, PNG or WebP images are allowed.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: 'La imagen debe pesar menos de 2 MB.' };
  }

  try {
    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    await mkdir(PHOTO_DIR, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(PHOTO_DIR, filename), Buffer.from(await file.arrayBuffer()));
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: `/uploads/photos/${filename}` },
    });
    await removeLocalPhoto(previous?.image ?? null);
  } catch {
    return { error: 'No se pudo guardar la foto.' };
  }

  redirect('/dashboard/player/profile');
}

/** Removes the profile photo (and the stored file, when it is a local upload). */
export async function removePlayerPhotoAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });
  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });
  await removeLocalPhoto(user?.image ?? null);

  redirect('/dashboard/player/profile');
}

export async function applyToOpportunityAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const opportunityId = str(formData, 'opportunityId');
  if (!opportunityId) {
    return { error: 'Invalid opportunity.' };
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return { error: 'Profile de jugador no encontrado.' };
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
    return { error: 'Could not submit the application.' };
  }

  // Notify the club/university that owns the opportunity.
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
        title: 'New application received',
        message: `${player.firstName} ${player.lastName} has requested to participate in "${opportunity.title}".`,
        link: '/dashboard/club/applications',
      });
    }
  } catch {
    // The notification must never break the application.
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
