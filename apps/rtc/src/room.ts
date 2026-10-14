import {
  MEDIA_KIND,
  ROOM_MAX_PARTICIPANTS,
  ROOM_PARTICIPANT_TIMEOUT_MS,
  encodeServerFrame,
  freeSlot,
  type MediaFrameHeader,
  type RtcErrorCode,
  type RtcParticipant,
  type RtcRole,
  type RtcServerMessage,
} from '@ifpc/rtc-protocol';

/**
 * Estado vivo de las salas. Es lógica pura (nada de `ws` ni de Prisma) para poder
 * testearla entera: el servicio real solo le pasa sockets y frames.
 */

/** Lo que la sala necesita de un socket para poder hablarle. */
export interface MemberSocket {
  send(message: RtcServerMessage): void;
  sendBinary(frame: Uint8Array): void;
  close(code: number, reason: string): void;
}

export interface RoomMember {
  userId: string;
  name: string;
  role: RtcRole;
  /** Índice en el roster (viaja en cada frame hacia los demás). */
  index: number;
  muted: boolean;
  cameraOff: boolean;
  handRaised: boolean;
  sharingScreen: boolean;
  transport: string;
  lastSeenAt: number;
  socket: MemberSocket;
}

export interface RoomState {
  id: string;
  title: string;
  maxParticipants: number;
  members: Map<string, RoomMember>;
  createdAt: number;
}

export interface JoinInput {
  roomId: string;
  title: string;
  maxParticipants?: number;
  userId: string;
  name: string;
  role: RtcRole;
  transport?: string;
  socket: MemberSocket;
  now?: number;
}

export type JoinResult =
  | { ok: true; member: RoomMember; participants: RtcParticipant[] }
  | { ok: false; code: RtcErrorCode; message: string };

/** Estado público de un miembro (sin socket). */
export function toParticipant(member: RoomMember): RtcParticipant {
  return {
    userId: member.userId,
    name: member.name,
    role: member.role,
    index: member.index,
    muted: member.muted,
    cameraOff: member.cameraOff,
    handRaised: member.handRaised,
    sharingScreen: member.sharingScreen,
    transport: member.transport,
  };
}

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomState>();

  constructor(
    private readonly timeoutMs: number = ROOM_PARTICIPANT_TIMEOUT_MS,
    private readonly maxParticipants: number = ROOM_MAX_PARTICIPANTS
  ) {}

  /** Salas abiertas en este proceso (para métricas y pruebas). */
  list(): RoomState[] {
    return [...this.rooms.values()];
  }

  get(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Mete a alguien en la sala. Devuelve `full` si está llena (cupo duro) y
   * **reemplaza** la conexión anterior del mismo usuario (recarga o cambio de red).
   */
  join(input: JoinInput): JoinResult {
    const now = input.now ?? Date.now();
    const max = input.maxParticipants ?? this.maxParticipants;

    let room = this.rooms.get(input.roomId);
    if (!room) {
      room = {
        id: input.roomId,
        title: input.title,
        maxParticipants: max,
        members: new Map(),
        createdAt: now,
      };
      this.rooms.set(input.roomId, room);
    }

    const previous = room.members.get(input.userId);
    if (!previous && room.members.size >= room.maxParticipants) {
      return { ok: false, code: 'full', message: 'This room is full.' };
    }

    if (previous) {
      // Reconexión: liberamos el hueco y avisamos como si hubiera salido.
      room.members.delete(input.userId);
      this.broadcast(room, { t: 'left', userId: previous.userId }, input.userId);
    }

    const index = previous?.index ?? freeSlot([...room.members.values()].map((row) => row.index));
    if (index === null) {
      return { ok: false, code: 'full', message: 'This room is full.' };
    }

    const member: RoomMember = {
      userId: input.userId,
      name: input.name,
      role: input.role,
      index,
      muted: false,
      cameraOff: false,
      handRaised: false,
      sharingScreen: false,
      transport: input.transport ?? 'relay',
      lastSeenAt: now,
      socket: input.socket,
    };
    room.members.set(member.userId, member);
    this.broadcast(room, { t: 'joined', participant: toParticipant(member) }, member.userId);

    return { ok: true, member, participants: [...room.members.values()].map(toParticipant) };
  }

  /** Saca a alguien de la sala y avisa al resto. */
  leave(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room?.members.has(userId)) return false;

    room.members.delete(userId);
    this.broadcast(room, { t: 'left', userId }, userId);
    if (room.members.size === 0) this.rooms.delete(roomId);
    return true;
  }



  /** Cambia el estado (micro, cámara, mano, pantalla) y lo reparte. */
  updateState(
    roomId: string,
    userId: string,
    patch: Partial<Pick<RoomMember, 'muted' | 'cameraOff' | 'handRaised' | 'sharingScreen'>>,
    now: number = Date.now()
  ): RtcParticipant | null {
    const room = this.rooms.get(roomId);
    const member = room?.members.get(userId);
    if (!room || !member) return null;

    if (patch.muted !== undefined) member.muted = patch.muted;
    if (patch.cameraOff !== undefined) member.cameraOff = patch.cameraOff;
    if (patch.handRaised !== undefined) member.handRaised = patch.handRaised;
    if (patch.sharingScreen !== undefined) member.sharingScreen = patch.sharingScreen;
    member.lastSeenAt = now;

    const participant = toParticipant(member);
    this.broadcast(room, { t: 'state', participant });
    return participant;
  }

  /** Late: solo refresca la marca de vida. */
  heartbeat(roomId: string, userId: string, now: number = Date.now()): boolean {
    const member = this.rooms.get(roomId)?.members.get(userId);
    if (!member) return false;

    member.lastSeenAt = now;
    return true;
  }

  /**
   * Reenvía un frame de medios a todos menos al emisor. Se codifica **una vez**
   * (el índice del emisor es el mismo para todos los receptores).
   */
  relay(roomId: string, userId: string, frame: MediaFrameHeader & { payload: Uint8Array }): number {
    const room = this.rooms.get(roomId);
    const sender = room?.members.get(userId);
    if (!room || !sender) return 0;
    if (frame.kind !== MEDIA_KIND.audio && frame.kind !== MEDIA_KIND.video) return 0;

    const encoded = encodeServerFrame({
      kind: frame.kind,
      index: sender.index,
      seq: frame.seq,
      payload: frame.payload,
    });

    let delivered = 0;
    for (const member of room.members.values()) {
      if (member.userId === userId) continue;
      this.deliver(member, encoded);
      delivered += 1;
    }
    return delivered;
  }

  /** Chat de texto de la sala. */
  chat(roomId: string, userId: string, text: string, now: number = Date.now()): boolean {
    const room = this.rooms.get(roomId);
    const member = room?.members.get(userId);
    const clean = text.trim().slice(0, 500);
    if (!room || !member || !clean) return false;

    this.broadcast(room, {
      t: 'chat',
      userId: member.userId,
      name: member.name,
      text: clean,
      at: new Date(now).toISOString(),
    });
    return true;
  }

  /** El host echa a alguien (o a todos menos él, si no se indica quién). */
  kick(roomId: string, hostUserId: string, targetUserId?: string): boolean {
    const room = this.rooms.get(roomId);
    const host = room?.members.get(hostUserId);
    if (!room || !host || host.role !== 'HOST') return false;

    const targets = targetUserId
      ? [room.members.get(targetUserId)].filter((row): row is RoomMember => Boolean(row))
      : [...room.members.values()].filter((row) => row.userId !== hostUserId);

    for (const target of targets) {
      target.socket.send({ t: 'error', code: 'ended', message: 'The host removed you.' });
      this.leave(roomId, target.userId);
      target.socket.close(4000, 'removed');
    }
    return targets.length > 0;
  }

  /** El host cierra la sala: todos fuera. */
  end(roomId: string, hostUserId: string): boolean {
    const room = this.rooms.get(roomId);
    const host = room?.members.get(hostUserId);
    if (!room || !host || host.role !== 'HOST') return false;

    for (const member of [...room.members.values()]) {
      member.socket.send({ t: 'ended' });
      member.socket.close(4001, 'room-ended');
    }
    this.rooms.delete(roomId);
    return true;
  }

  /**
   * Barre a quien lleva sin dar señales más del margen: se le saca y se avisa al
   * resto. Devuelve los expulsados, para poder loguearlos.
   */
  sweep(now: number = Date.now()): { roomId: string; userId: string }[] {
    const dropped: { roomId: string; userId: string }[] = [];

    for (const room of [...this.rooms.values()]) {
      for (const member of [...room.members.values()]) {
        if (now - member.lastSeenAt <= this.timeoutMs) continue;
        dropped.push({ roomId: room.id, userId: member.userId });
        member.socket.send({ t: 'error', code: 'ended', message: 'Connection lost.' });
        this.leave(room.id, member.userId);
        member.socket.close(4002, 'timeout');
      }
    }
    return dropped;
  }

  private broadcast(room: RoomState, message: RtcServerMessage, exceptUserId?: string): void {
    for (const member of room.members.values()) {
      if (member.userId === exceptUserId) continue;
      member.socket.send(message);
    }
  }

  /** Un socket roto no puede tumbar el broadcast a toda la sala. */
  private deliver(member: RoomMember, frame: Uint8Array): void {
    try {
      member.socket.sendBinary(frame);
    } catch {
      // Si el socket está cerrado, el barrido por latido lo sacará en breve.
    }
  }
}

