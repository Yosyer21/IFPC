/**
 * Protocolo de las **salas de vídeo** (`apps/rtc`). Es isomorfo a propósito: lo
 * usan igual el servicio (Node) y el navegador, así que aquí no puede haber nada
 * de Node ni de React. La firma de tokens vive aparte, en `./token`.
 */

/** Cupo de la sala: es un SFU pequeño, 4 es el techo sano y pedido. */
export const ROOM_MAX_PARTICIPANTS = 4;

/** Calidad de los medios (se codifica en el cliente; el servicio solo reenvía). */
export const ROOM_AUDIO_BITRATE = 32_000;
export const ROOM_VIDEO_BITRATE = 200_000;
export const ROOM_VIDEO_FPS = 15;
export const ROOM_VIDEO_WIDTH = 480;
export const ROOM_VIDEO_HEIGHT = 360;

/** Latido del cliente y margen antes de dar a alguien por caído. */
export const ROOM_HEARTBEAT_MS = 5_000;
export const ROOM_PARTICIPANT_TIMEOUT_MS = 20_000;

/** Minutos de antelación con los que se puede entrar a una sala programada. */
export const ROOM_OPEN_MINUTES_BEFORE = 10;

/** Cuánto vale el token de sala (se emite al entrar). */
export const ROOM_TOKEN_TTL_MS = 4 * 60 * 60 * 1000;

/** Tipos de frame binario que viajan por el WebSocket. */
export const MEDIA_KIND = { audio: 1, video: 2 } as const;
export type MediaKind = (typeof MEDIA_KIND)[keyof typeof MEDIA_KIND];

/** Cliente → servicio: `[kind:1][seq:4]`. */
export const CLIENT_FRAME_HEADER_BYTES = 5;
/** Servicio → cliente: `[kind:1][index:1][seq:4]` (el índice identifica al emisor). */
export const SERVER_FRAME_HEADER_BYTES = 6;

export interface MediaFrameHeader {
  kind: MediaKind;
  seq: number;
}

export interface ServerMediaFrameHeader extends MediaFrameHeader {
  /** Posición del emisor en el roster (0-3). */
  index: number;
}

export interface RtcParticipant {
  userId: string;
  name: string;
  role: RtcRole;
  /** Posición en el roster; viaja en la cabecera de cada frame. */
  index: number;
  muted: boolean;
  cameraOff: boolean;
  handRaised: boolean;
  sharingScreen: boolean;
  /** `relay` = nuestro SFU; `p2p` cuando llegue WebRTC. */
  transport: string;
}

export type RtcRole = 'HOST' | 'GUEST';

/** Mensajes de control cliente → servicio (JSON). */
export type RtcClientMessage =
  | { t: 'hello'; token: string }
  | {
      t: 'state';
      muted?: boolean;
      cameraOff?: boolean;
      handRaised?: boolean;
      sharingScreen?: boolean;
    }
  | { t: 'chat'; text: string }
  | { t: 'kick'; userId: string }
  | { t: 'end' }
  | { t: 'ping' };

/** Mensajes de control servicio → cliente (JSON). */
export type RtcServerMessage =
  | {
      t: 'welcome';
      room: { id: string; title: string; maxParticipants: number };
      self: { userId: string; role: RtcRole; index: number };
      participants: RtcParticipant[];
    }
  | { t: 'roster'; participants: RtcParticipant[] }
  | { t: 'joined'; participant: RtcParticipant }
  | { t: 'left'; userId: string }
  | { t: 'state'; participant: RtcParticipant }
  | { t: 'chat'; userId: string; name: string; text: string; at: string }
  | { t: 'error'; code: RtcErrorCode; message: string }
  | { t: 'ended' }
  | { t: 'pong' };

export type RtcErrorCode = 'unauthorized' | 'full' | 'not-open' | 'ended' | 'bad-message';

/** Escribe un frame de medios del cliente (cabecera sin índice). */
export function encodeClientFrame(frame: {
  kind: MediaKind;
  seq: number;
  payload: Uint8Array;
}): Uint8Array {
  const buffer = new Uint8Array(CLIENT_FRAME_HEADER_BYTES + frame.payload.length);
  buffer[0] = frame.kind;
  new DataView(buffer.buffer).setUint32(1, frame.seq >>> 0);
  buffer.set(frame.payload, CLIENT_FRAME_HEADER_BYTES);
  return buffer;
}

/** Lee un frame de medios del cliente; `null` si viene mal. */
export function decodeClientFrame(buffer: Uint8Array): {
  kind: MediaKind;
  seq: number;
  payload: Uint8Array;
} | null {
  if (buffer.length <= CLIENT_FRAME_HEADER_BYTES) return null;

  const kind = buffer[0];
  if (kind !== MEDIA_KIND.audio && kind !== MEDIA_KIND.video) return null;

  return {
    kind,
    seq: new DataView(buffer.buffer, buffer.byteOffset).getUint32(1),
    payload: buffer.subarray(CLIENT_FRAME_HEADER_BYTES),
  };
}

/** Escribe un frame de medios del servicio (con el índice del emisor). */
export function encodeServerFrame(frame: {
  kind: MediaKind;
  index: number;
  seq: number;
  payload: Uint8Array;
}): Uint8Array {
  const buffer = new Uint8Array(SERVER_FRAME_HEADER_BYTES + frame.payload.length);
  buffer[0] = frame.kind;
  buffer[1] = frame.index;
  new DataView(buffer.buffer).setUint32(2, frame.seq >>> 0);
  buffer.set(frame.payload, SERVER_FRAME_HEADER_BYTES);
  return buffer;
}

/** Lee un frame de medios del servicio; `null` si viene mal. */
export function decodeServerFrame(buffer: Uint8Array): ({
  payload: Uint8Array;
} & ServerMediaFrameHeader) | null {
  if (buffer.length <= SERVER_FRAME_HEADER_BYTES) return null;

  const kind = buffer[0];
  if (kind !== MEDIA_KIND.audio && kind !== MEDIA_KIND.video) return null;

  return {
    kind,
    index: buffer[1]!,
    seq: new DataView(buffer.buffer, buffer.byteOffset).getUint32(2),
    payload: buffer.subarray(SERVER_FRAME_HEADER_BYTES),
  };
}

/** Índice libre más bajo (0-3): el roster no crece más allá del cupo. */
export function freeSlot(taken: number[]): number | null {
  for (let index = 0; index < ROOM_MAX_PARTICIPANTS; index += 1) {
    if (!taken.includes(index)) return index;
  }
  return null;
}
