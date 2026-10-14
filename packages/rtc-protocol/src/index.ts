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

/**
 * Vía directa (WebRTC) entre dos participantes: la señalización viaja por el mismo
 * WebSocket de la sala, así que no hace falta ni STUN ni TURN.
 *
 * Los medios solo saltan al enlace directo cuando **los dos** lados dicen que está
 * conectado; el relay sigue siendo el camino por defecto y la red de seguridad.
 */
export const P2P_SIGNAL_MAX_BYTES = 16 * 1024;
/** Cuánto se espera a que un enlace directo conecte antes de dar por hecho el relay. */
export const P2P_CONNECT_TIMEOUT_MS = 5_000;
/** Reintento de un enlace que falló (cambio de red, por ejemplo). */
export const P2P_RETRY_MS = 8_000;
export const P2P_MAX_ATTEMPTS = 2;

/** Candidato ICE tal cual viaja por JSON (el navegador lo reconstruye). */
export interface IceCandidateWire {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment?: string | null;
}

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
  | { t: 'ping' }
  /** Señalización WebRTC hacia otro participante (`to` = userId). */
  | { t: 'p2p-offer'; to: string; sdp: string }
  | { t: 'p2p-answer'; to: string; sdp: string }
  | { t: 'p2p-ice'; to: string; candidate: IceCandidateWire | null }
  /** «Con este participante voy por la vía directa» (o he dejado de ir). */
  | { t: 'p2p-direct'; userId: string; direct: boolean };

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
  | { t: 'pong' }
  /** Señalización reenviada por el servicio (`from` = userId del otro lado). */
  | { t: 'p2p-offer'; from: string; sdp: string }
  | { t: 'p2p-answer'; from: string; sdp: string }
  | { t: 'p2p-ice'; from: string; candidate: IceCandidateWire | null };

export type RtcErrorCode = 'unauthorized' | 'full' | 'not-open' | 'ended' | 'bad-message';

/** Señalización entre dos participantes: el servicio solo la reenvía. */
export type RtcPeerSignal =
  | { t: 'p2p-offer'; to: string; sdp: string }
  | { t: 'p2p-answer'; to: string; sdp: string }
  | { t: 'p2p-ice'; to: string; candidate: IceCandidateWire | null };

/**
 * Lee y valida una señal recibida por el socket: es entrada de terceros, así que
 * una señal mal formada o desmedida se descarta sin más (el servicio no puede
 * fiarse de lo que le mande un cliente).
 */
export function readPeerSignal(input: unknown): RtcPeerSignal | null {
  if (!input || typeof input !== 'object') return null;

  const message = input as Record<string, unknown>;
  const to = typeof message.to === 'string' ? message.to : '';
  if (!to || to.length > 128) return null;

  if (message.t === 'p2p-ice') {
    const candidate = message.candidate;
    if (candidate === null || candidate === undefined) return { t: 'p2p-ice', to, candidate: null };
    if (typeof candidate !== 'object') return null;

    const row = candidate as Record<string, unknown>;
    if (typeof row.candidate !== 'string' || row.candidate.length > P2P_SIGNAL_MAX_BYTES) return null;

    return {
      t: 'p2p-ice',
      to,
      candidate: {
        candidate: row.candidate,
        sdpMid: typeof row.sdpMid === 'string' ? row.sdpMid : null,
        sdpMLineIndex: typeof row.sdpMLineIndex === 'number' ? row.sdpMLineIndex : null,
        usernameFragment: typeof row.usernameFragment === 'string' ? row.usernameFragment : null,
      },
    };
  }

  if (message.t !== 'p2p-offer' && message.t !== 'p2p-answer') return null;
  if (typeof message.sdp !== 'string' || message.sdp.length === 0) return null;
  if (message.sdp.length > P2P_SIGNAL_MAX_BYTES) return null;

  return { t: message.t, to, sdp: message.sdp };
}

/**
 * Clave de un par de participantes, sin importar el orden: el estado «vamos
 * directos» es cosa de dos, y los dos tienen que decirlo.
 */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Quién cede cuando los dos lados ofrecen a la vez (*glare*): el id menor manda.
 * Es determinista y opuesto en cada extremo, así que los dos llegan al mismo
 * acuerdo sin negociarlo.
 */
export function isPolitePeer(selfId: string, peerId: string): boolean {
  return selfId < peerId;
}

/** Escribe un frame de medios del cliente (cabecera sin índice). */
export function encodeClientFrame(frame: {
  kind: MediaKind;
  seq: number;
  payload: Uint8Array;
}): Uint8Array<ArrayBuffer> {
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
