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

function tokenFor(
  userId: string,
  role: 'HOST' | 'GUEST',
  name = userId,
  roomId: string = ROOM.id
): string {
  return signRoomToken(
    {
      roomId,
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

  it('cruza la señalización WebRTC y retira del relay a los pares directos', async () => {
    const room = 'room-p2p';
    const [ana, bea, carla] = [client(), client(), client()];

    await ana.opened;
    ana.hello(tokenFor('p2p-ana', 'HOST', 'Ana', room));
    await ana.waitFor('welcome');

    await bea.opened;
    bea.hello(tokenFor('p2p-bea', 'GUEST', 'Bea', room));
    await bea.waitFor('welcome');

    await carla.opened;
    carla.hello(tokenFor('p2p-carla', 'GUEST', 'Carla', room));
    await carla.waitFor('welcome');

    // 1. La oferta llega a quien va dirigida (con `from`) y a nadie más.
    ana.control({ t: 'p2p-offer', to: 'p2p-bea', sdp: 'v=0-oferta' });
    await expect(bea.waitFor('p2p-offer')).resolves.toMatchObject({
      from: 'p2p-ana',
      sdp: 'v=0-oferta',
    });
    await delay(100);
    expect(carla.inbox.filter((row) => row.t === 'p2p-offer')).toHaveLength(0);

    // 2. La respuesta y los candidatos vuelven por el mismo camino.
    bea.control({ t: 'p2p-answer', to: 'p2p-ana', sdp: 'v=0-respuesta' });
    await expect(ana.waitFor('p2p-answer')).resolves.toMatchObject({ from: 'p2p-bea' });

    bea.control({
      t: 'p2p-ice',
      to: 'p2p-ana',
      candidate: { candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 },
    });
    await expect(ana.waitFor('p2p-ice')).resolves.toMatchObject({
      from: 'p2p-bea',
      candidate: { candidate: 'candidate:1' },
    });

    // 3. Un destinatario que no existe se ignora en silencio (no es un error).
    ana.control({ t: 'p2p-offer', to: 'fantasma', sdp: 'v=0' });
    await delay(100);
    expect(ana.inbox.filter((row) => row.t === 'error')).toHaveLength(0);

    // 4. Con que lo diga uno solo, los medios siguen pasando por el servicio.
    ana.control({ t: 'p2p-direct', userId: 'p2p-bea', direct: true });
    await delay(100);
    ana.send(encodeClientFrame({ kind: MEDIA_KIND.video, seq: 1, payload: new Uint8Array([1]) }));
    await delay(150);
    expect(bea.frames).toHaveLength(1);
    expect(carla.frames).toHaveLength(1);

    // 5. Cuando lo dicen los dos, el par sale del relay: a Bea ya no le llega.
    bea.control({ t: 'p2p-direct', userId: 'p2p-ana', direct: true });
    await delay(100);
    ana.send(encodeClientFrame({ kind: MEDIA_KIND.video, seq: 2, payload: new Uint8Array([2]) }));
    await delay(150);
    expect(bea.frames).toHaveLength(1);
    expect(carla.frames).toHaveLength(2);

    // 6. Y si uno vuelve atrás (se cae la vía directa), el relay vuelve solo.
    bea.control({ t: 'p2p-direct', userId: 'p2p-ana', direct: false });
    await delay(100);
    ana.send(encodeClientFrame({ kind: MEDIA_KIND.video, seq: 3, payload: new Uint8Array([3]) }));
    await delay(150);
    expect(bea.frames).toHaveLength(2);

    for (const peer of [ana, bea, carla]) peer.close();
  }, 20_000);
});
