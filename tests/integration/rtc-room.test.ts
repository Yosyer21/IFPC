import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import {
  MEDIA_KIND,
  ROOM_TOKEN_TTL_MS,
  decodeServerFrame,
  encodeClientFrame,
  type RtcServerMessage,
} from '@ifpc/rtc-protocol';
import { signRoomToken } from '@ifpc/rtc-protocol/token';

/**
 * Integración del servicio de salas (`apps/rtc`) con WebSockets de verdad: arranca
 * el proceso, firma tokens como lo haría la web y comprueba entrar, compartir
 * medios, hablar por el chat y que el cupo se respeta.
 */
const PORT = 4199;
const SECRET = 'secreto-de-integracion';
const URL = `ws://127.0.0.1:${PORT}`;
const ROOM = { id: 'room-integration', title: 'Session 3', maxParticipants: 4 };

let service: ChildProcessWithoutNullStreams;

function tokenFor(userId: string, role: 'HOST' | 'GUEST', name = userId): string {
  return signRoomToken(
    {
      roomId: ROOM.id,
      title: ROOM.title,
      maxParticipants: ROOM.maxParticipants,
      userId,
      role,
      name,
      exp: Date.now() + ROOM_TOKEN_TTL_MS,
    },
    SECRET
  );
}

/** Cliente de prueba: guarda mensajes de control y frames de medios. */
function client() {
  const socket = new WebSocket(URL);
  const inbox: RtcServerMessage[] = [];
  const frames: Uint8Array[] = [];
  const opened = new Promise<void>((resolve) => socket.once('open', () => resolve()));

  socket.on('message', (data, isBinary) => {
    if (isBinary) {
      frames.push(new Uint8Array(data as Buffer));
      return;
    }
    inbox.push(JSON.parse(data.toString()) as RtcServerMessage);
  });

  return {
    socket,
    inbox,
    frames,
    opened,
    /** Espera a que llegue un mensaje que cumpla el filtro. */
    async waitFor<T extends RtcServerMessage['t']>(type: T, timeout = 3_000) {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        const found = inbox.find((message) => message.t === type);
        if (found) return found as Extract<RtcServerMessage, { t: T }>;
        await delay(20);
      }
      throw new Error(
        `No llegó ${type}. Recibido: ${JSON.stringify(inbox.map((row) => row.t))}`
      );
    },
    hello(token: string) {
      socket.send(JSON.stringify({ t: 'hello', token }));
    },
    send(frame: Uint8Array) {
      socket.send(frame, { binary: true });
    },
    control(message: Record<string, unknown>) {
      socket.send(JSON.stringify(message));
    },
    close() {
      socket.close();
    },
  };
}

beforeAll(async () => {
  service = spawn('node', ['--import=tsx', 'src/index.ts'], {
    cwd: 'apps/rtc',
    env: {
      ...process.env,
      PORT: String(PORT),
      ROOM_TOKEN_SECRET: SECRET,
      // Los avisos a la BD son best-effort: sin base de datos la sala sigue viva.
      DATABASE_URL: 'postgresql://nadie:nadie@127.0.0.1:1/nada',
    },
  });

  // Así se ven los logs del servicio si algo va mal en el test.
  service.stdout.on('data', (chunk: Buffer) => process.stdout.write(`[rtc] ${chunk.toString()}`));
  service.stderr.on('data', (chunk: Buffer) => process.stderr.write(`[rtc] ${chunk.toString()}`));

  // Espera al healthcheck para no competir con el arranque.
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/healthz`);
      if (response.ok) return;
    } catch {
      // Aún no escucha.
    }
    await delay(200);
  }
  throw new Error('El servicio rtc no arrancó');
}, 30_000);

afterAll(() => {
  service?.kill('SIGKILL');
});

describe('servicio de salas (WebSocket real)', () => {
  it('rechaza un token que no está firmado por nosotros', async () => {
    const intruder = client();
    await intruder.opened;
    intruder.hello('token-inventado');

    const error = await intruder.waitFor('error');
    expect(error).toMatchObject({ code: 'unauthorized' });
    intruder.close();
  });

  it('recibe a dos personas, reenvía medios, chat y respeta el cupo', async () => {
    const host = client();
    await host.opened;
    host.hello(tokenFor('user-host', 'HOST', 'Coach'));

    const welcome = await host.waitFor('welcome');
    expect(welcome).toMatchObject({
      room: { id: ROOM.id, title: ROOM.title, maxParticipants: 4 },
      self: { userId: 'user-host', role: 'HOST', index: 0 },
    });

    const guest = client();
    await guest.opened;
    guest.hello(tokenFor('user-guest', 'GUEST', 'Demo Player'));

    const guestWelcome = await guest.waitFor('welcome');
    expect(guestWelcome.participants.map((row) => row.index).sort()).toEqual([0, 1]);

    // El host se entera de que ha entrado.
    await expect(host.waitFor('joined')).resolves.toMatchObject({
      participant: { userId: 'user-guest', index: 1 },
    });

    // Medios: un frame del invitado llega al host con su índice.
    guest.send(
      encodeClientFrame({ kind: MEDIA_KIND.video, seq: 7, payload: new Uint8Array([9, 9, 9]) })
    );
    await delay(150);
    const frame = decodeServerFrame(host.frames[0]!);
    expect(frame).toMatchObject({ kind: MEDIA_KIND.video, index: 1, seq: 7 });

    // Estado y chat.
    guest.control({ t: 'state', muted: true });
    await expect(host.waitFor('state')).resolves.toMatchObject({
      participant: { userId: 'user-guest', muted: true },
    });

    guest.control({ t: 'chat', text: 'hola' });
    await expect(host.waitFor('chat')).resolves.toMatchObject({
      userId: 'user-guest',
      name: 'Demo Player',
      text: 'hola',
    });

    // Cupo: entran dos más y el quinto no cabe.
    const extra: ReturnType<typeof client>[] = [];
    for (const id of ['user-3', 'user-4']) {
      const client3 = client();
      await client3.opened;
      client3.hello(tokenFor(id, 'GUEST', id));
      await client3.waitFor('welcome');
      extra.push(client3);
    }

    const overflow = client();
    await overflow.opened;
    overflow.hello(tokenFor('user-5', 'GUEST', 'user-5'));
    await expect(overflow.waitFor('error')).resolves.toMatchObject({ code: 'full' });

    // El host cierra la sala: todos reciben el aviso.
    host.control({ t: 'end' });
    await expect(guest.waitFor('ended')).resolves.toEqual({ t: 'ended' });

    for (const client3 of [host, guest, overflow, ...extra]) client3.close();
  }, 20_000);
});
