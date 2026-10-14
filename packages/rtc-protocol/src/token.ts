import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RtcRole } from './index';

/**
 * Token de sala: firma propia con HMAC-SHA256 (sin dependencias y sin cookies
 * cruzadas entre el dominio de la web y el del servicio `rtc`). El servicio lo
 * valida en el primer mensaje del WebSocket.
 *
 * Este módulo es **solo para Node** (usa `node:crypto`): no lo importe el
 * navegador. Se expone por el subpath `@ifpc/rtc-protocol/token`.
 */
export interface RoomTokenPayload {
  roomId: string;
  /** Título de la sala (viaja firmado para que el servicio no consulte la BD). */
  title: string;
  maxParticipants: number;
  userId: string;
  role: RtcRole;
  /** Nombre visible dentro de la sala. */
  name: string;
  /** Caducidad, en milisegundos epoch. */
  exp: number;
}

/** Secreto compartido entre la web y el servicio `rtc`. */
export function roomTokenSecret(env: NodeJS.ProcessEnv = process.env): string {
  return env.ROOM_TOKEN_SECRET ?? env.AUTH_SECRET ?? 'ifpc-dev-room-secret';
}

/** Firma un token de sala. */
export function signRoomToken(payload: RoomTokenPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

/** Verifica firma y caducidad; `null` si el token no vale. */
export function verifyRoomToken(
  token: string,
  secret: string,
  now: number = Date.now()
): RoomTokenPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (received.length !== computed.length || !timingSafeEqual(received, computed)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as RoomTokenPayload;
    if (!payload.roomId || !payload.userId || !payload.name) return null;
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
