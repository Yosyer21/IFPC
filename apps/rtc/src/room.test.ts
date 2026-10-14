import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MEDIA_KIND,
  decodeServerFrame,
  encodeClientFrame,
  type RtcServerMessage,
} from '@ifpc/rtc-protocol';
import { RoomRegistry, type MemberSocket } from './room';

/** Socket de mentira: guarda todo lo que la sala le manda. */
function fakeSocket() {
  return {
    messages: [] as RtcServerMessage[],
    frames: [] as Uint8Array[],
    closed: [] as { code: number; reason: string }[],
    send(message: RtcServerMessage) {
      this.messages.push(message);
    },
    sendBinary(frame: Uint8Array) {
      this.frames.push(frame);
    },
    close(code: number, reason: string) {
      this.closed.push({ code, reason });
    },
  };
}

type FakeSocket = ReturnType<typeof fakeSocket>;

function joinRoom(
  registry: RoomRegistry,
  socket: FakeSocket | MemberSocket,
  overrides: Partial<Parameters<RoomRegistry['join']>[0]> = {}
) {
  return registry.join({
    roomId: 'room-1',
    title: 'Session 3',
    userId: 'user-1',
    name: 'Demo Player',
    role: 'GUEST',
    socket,
    ...overrides,
  });
}

let registry: RoomRegistry;
let host: FakeSocket;
let guest: FakeSocket;

beforeEach(() => {
  registry = new RoomRegistry();
  host = fakeSocket();
  guest = fakeSocket();
});

describe('entrar y salir', () => {
  it('da índices de roster distintos y avisa a los que ya estaban', () => {
    const first = joinRoom(registry, host, { userId: 'host', role: 'HOST', name: 'Coach' });
    const second = joinRoom(registry, guest, { userId: 'guest' });

    expect(first.ok && first.member.index).toBe(0);
    expect(second.ok && second.member.index).toBe(1);
    expect(host.messages).toEqual([
      { t: 'joined', participant: expect.objectContaining({ userId: 'guest' }) },
    ]);
    expect(second.ok && second.participants).toHaveLength(2);
  });

  it('llena el cupo y rechaza al quinto', () => {
    for (const id of ['u1', 'u2', 'u3', 'u4']) {
      expect(joinRoom(registry, fakeSocket(), { userId: id }).ok).toBe(true);
    }

    const overflow = joinRoom(registry, fakeSocket(), { userId: 'u5' });

    expect(overflow).toEqual({ ok: false, code: 'full', message: 'This room is full.' });
  });

  it('la reconexión del mismo usuario reutiliza su índice y avisa de la salida previa', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    joinRoom(registry, guest, { userId: 'guest' });
    const reconnected = fakeSocket();

    const result = joinRoom(registry, reconnected, { userId: 'guest' });

    expect(result.ok && result.member.index).toBe(1);
    expect(registry.get('room-1')?.members.size).toBe(2);
    expect(host.messages).toEqual([
      expect.objectContaining({ t: 'joined' }),
      { t: 'left', userId: 'guest' },
      expect.objectContaining({ t: 'joined' }),
    ]);
  });

  it('al salir avisa al resto y borra la sala cuando queda vacía', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    joinRoom(registry, guest, { userId: 'guest' });

    expect(registry.leave('room-1', 'guest')).toBe(true);
    expect(host.messages.at(-1)).toEqual({ t: 'left', userId: 'guest' });

    registry.leave('room-1', 'host');
    expect(registry.get('room-1')).toBeUndefined();
  });
});


describe('medios y estado', () => {
  it('reenvía los frames al resto con el índice del emisor', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    joinRoom(registry, guest, { userId: 'guest' });
    const third = fakeSocket();
    joinRoom(registry, third, { userId: 'third' });

    const delivered = registry.relay('room-1', 'guest', {
      kind: MEDIA_KIND.video,
      seq: 9,
      payload: new Uint8Array([1, 2, 3]),
    });

    expect(delivered).toBe(2);
    expect(guest.frames).toHaveLength(0);
    const frame = decodeServerFrame(third.frames[0]!);
    expect(frame).toMatchObject({ kind: MEDIA_KIND.video, index: 1, seq: 9 });
    expect([...(frame?.payload ?? [])]).toEqual([1, 2, 3]);
  });

  it('acepta el frame tal y como lo manda el cliente', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    joinRoom(registry, guest, { userId: 'guest' });

    const wire = encodeClientFrame({
      kind: MEDIA_KIND.audio,
      seq: 3,
      payload: new Uint8Array([5]),
    });
    registry.relay('room-1', 'host', { kind: MEDIA_KIND.audio, seq: 3, payload: wire.subarray(5) });

    expect(decodeServerFrame(guest.frames[0]!)).toMatchObject({ kind: MEDIA_KIND.audio, index: 0 });
  });

  it('reparte el estado (micro, cámara, mano) a toda la sala', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    joinRoom(registry, guest, { userId: 'guest' });

    registry.updateState('room-1', 'guest', { muted: true, handRaised: true });

    expect(guest.messages.at(-1)).toEqual({
      t: 'state',
      participant: expect.objectContaining({ userId: 'guest', muted: true, handRaised: true }),
    });
    expect(host.messages.at(-1)).toEqual(expect.objectContaining({ t: 'state' }));
  });

  it('manda el chat de texto sin dejarlo vacío', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    joinRoom(registry, guest, { userId: 'guest' });

    expect(registry.chat('room-1', 'guest', '  hola  ')).toBe(true);
    expect(registry.chat('room-1', 'guest', '   ')).toBe(false);
    expect(host.messages.at(-1)).toEqual(
      expect.objectContaining({ t: 'chat', userId: 'guest', text: 'hola' })
    );
  });
});

describe('moderación y caídas', () => {
  it('solo el host echa o cierra la sala', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    joinRoom(registry, guest, { userId: 'guest' });

    expect(registry.kick('room-1', 'guest', 'host')).toBe(false);
    expect(registry.kick('room-1', 'host', 'guest')).toBe(true);
    expect(guest.closed[0]).toMatchObject({ code: 4000 });

    expect(registry.end('room-1', 'guest')).toBe(false);
    expect(registry.end('room-1', 'host')).toBe(true);
    expect(host.closed[0]).toMatchObject({ code: 4001 });
    expect(registry.get('room-1')).toBeUndefined();
  });

  it('barre a quien deja de latir', () => {
    const joinAt = 1_000_000;
    joinRoom(registry, host, { userId: 'host', role: 'HOST', now: joinAt });
    joinRoom(registry, guest, { userId: 'guest', now: joinAt });

    expect(registry.sweep(joinAt + 5_000)).toEqual([]);
    const dropped = registry.sweep(joinAt + 60_000);

    expect(dropped).toEqual([
      { roomId: 'room-1', userId: 'host' },
      { roomId: 'room-1', userId: 'guest' },
    ]);
    expect(host.closed[0]).toMatchObject({ code: 4002 });
    expect(registry.get('room-1')).toBeUndefined();
  });

  it('el latido mantiene dentro al que avisa', () => {
    joinRoom(registry, guest, { userId: 'guest', now: 0 });

    expect(registry.heartbeat('room-1', 'guest', 10_000)).toBe(true);
    expect(registry.sweep(15_000)).toEqual([]);
    expect(registry.heartbeat('room-1', 'fantasma')).toBe(false);
  });

  it('un socket roto no tumba el broadcast', () => {
    joinRoom(registry, host, { userId: 'host', role: 'HOST' });
    const broken = { ...fakeSocket(), sendBinary: vi.fn(() => { throw new Error('cerrado'); }) };
    const healthy = fakeSocket();
    joinRoom(registry, broken as unknown as MemberSocket, { userId: 'u3' });
    joinRoom(registry, healthy, { userId: 'u4' });

    expect(
      registry.relay('room-1', 'host', {
        kind: MEDIA_KIND.audio,
        seq: 1,
        payload: new Uint8Array([1]),
      })
    ).toBe(2);
    expect(healthy.frames).toHaveLength(1);
  });
});
