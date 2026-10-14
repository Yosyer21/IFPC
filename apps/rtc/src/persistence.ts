import { prisma } from '@ifpc/database';
import type { RtcRole } from '@ifpc/rtc-protocol';

/**
 * Sincronización con la base de datos (presencia y estado de la sala) para que la
 * web pueda enseñar quién está dentro y qué pasó al terminar.
 *
 * Es **best-effort** a propósito: si la BD falla o tarda, la sala sigue
 * funcionando en memoria; nunca se cae una videollamada porque Prisma estornude.
 */

function warn(action: string, error: unknown): void {
  console.warn(`[rtc] no se pudo ${action}:`, error instanceof Error ? error.message : error);
}

/** Alguien entra: queda su presencia y la sala pasa a LIVE. */
export async function markJoined(input: {
  roomId: string;
  userId: string;
  role: RtcRole;
  transport: string;
}): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.trainingRoomParticipant.upsert({
        where: { roomId_userId: { roomId: input.roomId, userId: input.userId } },
        create: {
          roomId: input.roomId,
          userId: input.userId,
          role: input.role,
          joinedAt: new Date(),
          lastSeenAt: new Date(),
          transport: input.transport,
        },
        update: {
          role: input.role,
          joinedAt: new Date(),
          leftAt: null,
          lastSeenAt: new Date(),
          transport: input.transport,
        },
      }),
      prisma.trainingRoom.update({
        where: { id: input.roomId },
        data: { status: 'LIVE' },
      }),
    ]);
  } catch (error) {
    warn('marcar la entrada en la sala', error);
  }
}

/** Alguien sale (o se le echa): se cierra su presencia. */
export async function markLeft(roomId: string, userId: string): Promise<void> {
  try {
    await prisma.trainingRoomParticipant.updateMany({
      where: { roomId, userId },
      data: { leftAt: new Date(), handRaised: false, sharingScreen: false },
    });
  } catch (error) {
    warn('marcar la salida de la sala', error);
  }
}

/** Estado de un participante (micro, cámara, mano, pantalla). */
export async function markState(
  roomId: string,
  userId: string,
  patch: { muted?: boolean; cameraOff?: boolean; handRaised?: boolean; sharingScreen?: boolean }
): Promise<void> {
  try {
    await prisma.trainingRoomParticipant.updateMany({
      where: { roomId, userId },
      data: { ...patch, lastSeenAt: new Date() },
    });
  } catch (error) {
    warn('guardar el estado del participante', error);
  }
}

/** El host cierra la sala. */
export async function markEnded(roomId: string): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.trainingRoom.update({
        where: { id: roomId },
        data: { status: 'ENDED', endsAt: new Date() },
      }),
      prisma.trainingRoomParticipant.updateMany({
        where: { roomId, leftAt: null },
        data: { leftAt: new Date() },
      }),
    ]);
  } catch (error) {
    warn('cerrar la sala', error);
  }
}
