import { randomBytes } from 'node:crypto';
import { prisma } from '@ifpc/database';
import {
  ROOM_OPEN_MINUTES_BEFORE,
  ROOM_TOKEN_TTL_MS,
  type RtcRole,
} from '@ifpc/rtc-protocol';
import { roomTokenSecret, signRoomToken } from '@ifpc/rtc-protocol/token';
import { ACTIVE_CONTRACT_STATUSES, authorOf, type TrainingAuthor } from '@/lib/training';

/**
 * Salas de vídeo del Football Center (lado web): permisos, ventana de entrada y
 * emisión del token con el que el navegador se conecta al servicio `rtc`.
 * Los medios NO pasan por aquí: los lleva `apps/rtc` por WebSocket.
 */

export interface TrainingRoomInvitee {
  playerId: string;
  name: string;
}

export interface TrainingRoomPresence {
  userId: string;
  name: string;
  role: RtcRole;
  joinedAt: Date | null;
}

export interface TrainingRoomView {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scope: string;
  maxParticipants: number;
  opensAt: Date;
  startsAt: Date;
  endsAt: Date | null;
  joinCode: string;
  author: TrainingAuthor;
  invites: TrainingRoomInvitee[];
  present: TrainingRoomPresence[];
}

/** Motivo por el que no se puede entrar (para explicarlo en la UI). */
export type RoomWindowReason = 'open' | 'before' | 'ended' | 'closed';

/**
 * ¿Se puede entrar ya? Una sala se abre unos minutos antes de su hora, se cierra
 * al terminar y queda cerrada cuando el host la da por terminada.
 */
export function roomWindow(
  room: { opensAt: Date; endsAt: Date | null; status: string },
  now: Date = new Date()
): { open: boolean; reason: RoomWindowReason; opensInMinutes: number } {
  const opensInMinutes = Math.max(0, Math.ceil((room.opensAt.getTime() - now.getTime()) / 60_000));

  if (room.status === 'ENDED' || room.status === 'CANCELLED') {
    return { open: false, reason: 'ended', opensInMinutes };
  }
  if (room.endsAt && room.endsAt.getTime() <= now.getTime()) {
    return { open: false, reason: 'ended', opensInMinutes };
  }
  if (room.opensAt.getTime() > now.getTime()) {
    return { open: false, reason: 'before', opensInMinutes };
  }
  if (room.status === 'SCHEDULED' || room.status === 'LIVE') {
    return { open: true, reason: 'open', opensInMinutes: 0 };
  }
  return { open: false, reason: 'closed', opensInMinutes };
}

/** Código de sala: 10 caracteres sin vocales, para poder dictarlo sin errores. */
export function newJoinCode(): string {
  const alphabet = '23456789bcdfghjklmnpqrstvwxyz';
  const bytes = randomBytes(10);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]!).join('');
}

/**
 * Token de sala para ese usuario concreto. Lo valida el servicio `rtc` en el
 * primer mensaje del WebSocket: nunca se fía de nada que llegue del navegador.
 */
export function mintRoomToken(
  room: { id: string; title: string; maxParticipants: number },
  viewer: { userId: string; name: string; role: RtcRole },
  now: Date = new Date()
): string {
  return signRoomToken(
    {
      roomId: room.id,
      title: room.title,
      maxParticipants: room.maxParticipants,
      userId: viewer.userId,
      role: viewer.role,
      name: viewer.name,
      exp: now.getTime() + ROOM_TOKEN_TTL_MS,
    },
    roomTokenSecret()
  );
}

/** Horas por defecto: empieza en 5 minutos, con la ventana ya abierta. */
export function defaultRoomTimes(now: Date = new Date()): { opensAt: Date; startsAt: Date } {
  const startsAt = new Date(now.getTime() + 5 * 60_000);
  return {
    startsAt,
    opensAt: new Date(startsAt.getTime() - ROOM_OPEN_MINUTES_BEFORE * 60_000),
  };
}

/** `include` compartido: autor, invitados y quién está dentro. */
const ROOM_INCLUDE = {
  coach: { select: { id: true, clubName: true, user: { select: { name: true } } } },
  club: { select: { id: true, name: true } },
  targets: { select: { player: { select: { id: true, firstName: true, lastName: true } } } },
  participants: {
    where: { leftAt: null },
    orderBy: { joinedAt: 'asc' },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      lastSeenAt: true,
      user: { select: { name: true } },
    },
  },
} as const;

interface RoomRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scope: string;
  maxParticipants: number;
  opensAt: Date;
  startsAt: Date;
  endsAt: Date | null;
  joinCode: string;
  ownerType: string;
  coach: { id: string; clubName: string | null; user: { name: string | null } } | null;
  club: { id: string; name: string } | null;
  targets: { player: { id: string; firstName: string; lastName: string } }[];
  participants: {
    userId: string;
    role: string;
    joinedAt: Date | null;
    lastSeenAt: Date;
    user: { name: string | null };
  }[];
}

/** Presencia caducada: si el navegador se cae de golpe, deja de latir. */
const PRESENCE_STALE_MS = 60_000;

/** Convierte la fila de Prisma en la sala que pinta la vista. */
export function mapRoomRow(row: RoomRow, now: Date = new Date()): TrainingRoomView {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    scope: row.scope,
    maxParticipants: row.maxParticipants,
    opensAt: row.opensAt,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    joinCode: row.joinCode,
    author: authorOf(row),
    invites: row.targets.map((target) => ({
      playerId: target.player.id,
      name: `${target.player.firstName} ${target.player.lastName}`.trim(),
    })),
    present: row.participants
      .filter(
        (participant) => now.getTime() - participant.lastSeenAt.getTime() <= PRESENCE_STALE_MS
      )
      .map((participant) => ({
        userId: participant.userId,
        name: participant.user.name ?? 'Player',
        role: participant.role as RtcRole,
        joinedAt: participant.joinedAt,
      })),
  };
}

/** Salas que ha abierto un autor (coach o club), de la más nueva a la más vieja. */
export async function listAuthoredRooms(owner: {
  coachId: string | null;
  clubId: string | null;
}): Promise<TrainingRoomView[]> {
  if (!owner.coachId && !owner.clubId) return [];

  const rows = await prisma.trainingRoom.findMany({
    where: owner.coachId ? { coachId: owner.coachId } : { clubId: owner.clubId ?? undefined },
    orderBy: [{ startsAt: 'desc' }],
    take: 50,
    include: ROOM_INCLUDE,
  });

  return rows.map((row) => mapRoomRow(row));
}

/** Salas a las que está invitado un jugador (por invitación o por audiencia). */
export async function listPlayerRooms(player: {
  playerId: string | null;
  coachIds: string[];
  clubIds: string[];
}): Promise<TrainingRoomView[]> {
  const ors: Record<string, unknown>[] = [];
  if (player.playerId) ors.push({ targets: { some: { playerId: player.playerId } } });
  if (player.coachIds.length > 0) ors.push({ coachId: { in: player.coachIds }, scope: 'AUDIENCE' });
  if (player.clubIds.length > 0) ors.push({ clubId: { in: player.clubIds }, scope: 'AUDIENCE' });
  if (ors.length === 0) return [];

  const rows = await prisma.trainingRoom.findMany({
    where: { AND: [{ status: { in: ['SCHEDULED', 'LIVE'] } }, { OR: ors }] },
    orderBy: [{ startsAt: 'asc' }],
    take: 50,
    include: ROOM_INCLUDE,
  });

  return rows.map((row) => mapRoomRow(row));
}

/** Sala propia de un autor (para terminarla desde la web). */
export async function ownedRoom(
  roomId: string,
  owner: { coachId: string | null; clubId: string | null }
): Promise<{ id: string; title: string; status: string } | null> {
  const room = await prisma.trainingRoom.findUnique({
    where: { id: roomId },
    select: { id: true, title: true, status: true, coachId: true, clubId: true },
  });
  if (!room) return null;

  const owns =
    (owner.coachId !== null && room.coachId === owner.coachId) ||
    (owner.clubId !== null && room.clubId === owner.clubId);
  return owns ? { id: room.id, title: room.title, status: room.status } : null;
}

/**
 * Resuelve la sala de un enlace y si ese usuario puede entrar: el autor siempre,
 * y los jugadores invitados (o de su audiencia cuando la sala es abierta).
 */
export async function findRoomForUser(
  userId: string,
  joinCode: string
): Promise<
  | {
      room: TrainingRoomView;
      viewer: { userId: string; name: string; role: RtcRole };
      window: ReturnType<typeof roomWindow>;
      allowed: boolean;
    }
  | null
> {
  const row = await prisma.trainingRoom.findUnique({
    where: { joinCode },
    include: { ...ROOM_INCLUDE, targets: { select: { playerId: true } } },
  });
  if (!row) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, coach: { select: { id: true } }, club: { select: { id: true } } },
  });
  if (!user) return null;

  const isHost =
    (user.coach?.id != null && row.coachId === user.coach.id) ||
    (user.club?.id != null && row.clubId === user.club.id);

  const player = await prisma.player.findUnique({ where: { userId }, select: { id: true } });
  const invited = player ? row.targets.some((target) => target.playerId === player.id) : false;

  // Sala abierta a toda la audiencia: basta con pertenecer a ella.
  let inAudience = false;
  if (!isHost && !invited && row.scope === 'AUDIENCE' && player) {
    const [link, contract] = await Promise.all([
      row.coachId
        ? prisma.coachPlayer.findFirst({ where: { coachId: row.coachId, playerId: player.id } })
        : null,
      row.clubId
        ? prisma.contract.findFirst({
            where: {
              clubId: row.clubId,
              playerId: player.id,
              status: { in: ACTIVE_CONTRACT_STATUSES },
            },
          })
        : null,
    ]);
    inAudience = Boolean(link || contract);
  }

  return {
    room: mapRoomRow(row as unknown as RoomRow),
    viewer: { userId, name: user.name ?? 'Player', role: isHost ? 'HOST' : 'GUEST' },
    window: roomWindow(row),
    allowed: isHost || invited || inAudience,
  };
}

