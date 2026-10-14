import { describe, expect, it } from 'vitest';
import { ROOM_TOKEN_TTL_MS } from './index';
import { roomTokenSecret, signRoomToken, verifyRoomToken } from './token';

const payload = {
  roomId: 'room-1',
  title: 'Session 3',
  maxParticipants: 4,
  userId: 'user-1',
  role: 'GUEST' as const,
  name: 'Demo Player',
  exp: Date.now() + ROOM_TOKEN_TTL_MS,
};

describe('token de sala', () => {
  it('firma y verifica un token válido', () => {
    const token = signRoomToken(payload, 'secreto');

    expect(verifyRoomToken(token, 'secreto')).toMatchObject({
      roomId: 'room-1',
      userId: 'user-1',
      role: 'GUEST',
      name: 'Demo Player',
    });
  });

  it('rechaza firma manipulada, otro secreto o token sin firma', () => {
    const token = signRoomToken(payload, 'secreto');
    const [body] = token.split('.');

    expect(verifyRoomToken(`${body}.firmafalsa`, 'secreto')).toBeNull();
    expect(verifyRoomToken(token, 'otro-secreto')).toBeNull();
    expect(verifyRoomToken(body ?? '', 'secreto')).toBeNull();
    expect(verifyRoomToken('', 'secreto')).toBeNull();
  });

  it('rechaza el token caducado', () => {
    const token = signRoomToken({ ...payload, exp: 1_000 }, 'secreto');

    expect(verifyRoomToken(token, 'secreto', 2_000)).toBeNull();
    expect(verifyRoomToken(token, 'secreto', 500)).not.toBeNull();
  });

  it('rechaza cargas incompletas aunque la firma cuadre', () => {
    const token = signRoomToken({ ...payload, userId: '' }, 'secreto');

    expect(verifyRoomToken(token, 'secreto')).toBeNull();
  });

  it('el secreto sale del entorno y tiene respaldo para desarrollo', () => {
    expect(roomTokenSecret({ ROOM_TOKEN_SECRET: 'propio' } as NodeJS.ProcessEnv)).toBe('propio');
    expect(roomTokenSecret({ AUTH_SECRET: 'auth' } as NodeJS.ProcessEnv)).toBe('auth');
    expect(roomTokenSecret({} as NodeJS.ProcessEnv)).toBe('ifpc-dev-room-secret');
  });
});
