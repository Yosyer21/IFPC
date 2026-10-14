'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { ROOM_MAX_PARTICIPANTS, ROOM_OPEN_MINUTES_BEFORE } from '@ifpc/rtc-protocol';
import type { ActionState } from './auth';
import { notifyUser } from '@/lib/notifications/notify';
import { revalidatePaths } from '@/lib/revalidate';
import { trainingAuthor } from '@/lib/training';
import { resolveTrainingAssignment, targetCreateInput } from '@/lib/training-assignments';
import { defaultRoomTimes, newJoinCode, ownedRoom } from '@/lib/training-rooms';
import { trainingAudienceUserIds } from '@/lib/training-notify';

/**
 * Salas de vídeo: crearlas (con sus invitados y su aviso) y terminarlas. Los
 * medios y la presencia en directo los lleva el servicio `rtc`.
 */

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/** Fecha del formulario (`datetime-local`); `null` si no se indicó ninguna. */
function dateFrom(formData: FormData, key: string): Date | null {
  const raw = str(formData, key);
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Abre una sala para los jugadores elegidos (o para toda la audiencia) y les
 * avisa. Sin hora se entiende «ahora»: se abre unos minutos antes por si alguien
 * llega temprano.
 */
export async function createTrainingRoomAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const author = await trainingAuthor(session.user.id);
  if (!author.coachId && !author.clubId) {
    return { error: 'Only coaches and clubs can open rooms.' };
  }

  const title = str(formData, 'title');
  if (!title || title.length < 3) {
    return { error: 'Give the room a title.' };
  }

  const assignment = await resolveTrainingAssignment(formData, author);
  if ('error' in assignment) {
    return { error: assignment.error };
  }

  const startsAt = dateFrom(formData, 'startsAt') ?? defaultRoomTimes().startsAt;
  const opensAt = new Date(startsAt.getTime() - ROOM_OPEN_MINUTES_BEFORE * 60_000);

  let created;
  try {
    created = await prisma.trainingRoom.create({
      data: {
        title,
        description: str(formData, 'description'),
        ownerType: author.coachId ? 'COACH' : 'CLUB',
        coachId: author.coachId,
        clubId: author.clubId,
        status: 'SCHEDULED',
        maxParticipants: ROOM_MAX_PARTICIPANTS,
        opensAt,
        startsAt,
        joinCode: newJoinCode(),
        ...targetCreateInput(assignment),
      },
      include: { targets: { select: { playerId: true } } },
    });
  } catch {
    return { error: 'The room could not be created.' };
  }

  // Aviso en la campana de quien está invitado (solo de esto, no de los medios).
  const userIds = await trainingAudienceUserIds({
    ownerType: created.ownerType,
    coachId: created.coachId,
    clubId: created.clubId,
    scope: created.scope,
    targetPlayerIds: created.targets.map((target) => target.playerId),
  });
  for (const userId of userIds) {
    await notifyUser({
      userId,
      type: 'training',
      title: 'Live room',
      message: created.title,
      link: `/dashboard/rooms/${created.joinCode}`,
    });
  }

  revalidatePaths('/dashboard/rooms', `/dashboard/rooms/${created.joinCode}`);
  redirect(`/dashboard/rooms/${created.joinCode}`);
}

/** Termina la sala propia: deja de poder entrarse y se cierra la presencia. */
export async function endTrainingRoomAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const roomId = str(formData, 'roomId');
  if (!roomId) return;

  const author = await trainingAuthor(session.user.id);
  const room = await ownedRoom(roomId, author);
  if (!room) return;

  await prisma.$transaction([
    prisma.trainingRoom.update({
      where: { id: room.id },
      data: { status: 'ENDED', endsAt: new Date() },
    }),
    prisma.trainingRoomParticipant.updateMany({
      where: { roomId: room.id, leftAt: null },
      data: { leftAt: new Date() },
    }),
  ]);

  revalidatePaths('/dashboard/rooms');
  redirect('/dashboard/rooms');
}
