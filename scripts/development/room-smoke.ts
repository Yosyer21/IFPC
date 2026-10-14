// Prueba manual del servicio de salas: firma dos tokens como lo haría la web,
// entra con dos clientes y comprueba que los medios se reenvían.
//
// Uso:
//   ROOM_TOKEN_SECRET=... node --import=tsx scripts/development/room-smoke.ts [ws://127.0.0.1:4001]
import WebSocket from 'ws';
import { MEDIA_KIND, ROOM_TOKEN_TTL_MS, decodeServerFrame, encodeClientFrame } from '@ifpc/rtc-protocol';
import { signRoomToken, roomTokenSecret } from '@ifpc/rtc-protocol/token';

const url = process.argv[2] ?? 'ws://127.0.0.1:4001';
const secret = roomTokenSecret();

function connect(userId: string, role: 'HOST' | 'GUEST', name: string) {
  const token = signRoomToken(
    {
      roomId: 'smoke-room',
      title: 'Smoke room',
      maxParticipants: 4,
      userId,
      role,
      name,
      exp: Date.now() + ROOM_TOKEN_TTL_MS,
    },
    secret
  );

  const socket = new WebSocket(url);
  socket.binaryType = 'arraybuffer';
  const events: string[] = [];

  socket.on('open', () => socket.send(JSON.stringify({ t: 'hello', token })));
  socket.on('message', (data, isBinary) => {
    if (isBinary) {
      const frame = decodeServerFrame(new Uint8Array(data as Buffer));
      events.push(`media:${frame?.kind === MEDIA_KIND.audio ? 'audio' : 'video'}:idx${frame?.index}`);
      return;
    }
    const message = JSON.parse(data.toString()) as { t: string; code?: string };
    events.push(message.code ? `${message.t}:${message.code}` : message.t);
  });
  socket.on('error', (error) => events.push(`socket-error:${error.message}`));

  return { socket, events, send: (frame: Uint8Array) => socket.send(frame, { binary: true }) };
}

const host = connect('host', 'HOST', 'Coach');
const guest = connect('guest', 'GUEST', 'Demo Player');

setTimeout(() => {
  guest.send(encodeClientFrame({ kind: MEDIA_KIND.audio, seq: 1, payload: new Uint8Array([1, 2]) }));
  guest.send(encodeClientFrame({ kind: MEDIA_KIND.video, seq: 2, payload: new Uint8Array([3, 4]) }));
}, 900);

setTimeout(() => {
  console.log('host   →', host.events.join(', '));
  console.log('guest  →', guest.events.join(', '));
  const ok = host.events.includes('media:audio:idx1') && host.events.includes('media:video:idx1');
  console.log(ok ? 'OK: los medios llegan al host' : 'FALLO: no llegaron los medios');
  host.socket.close();
  guest.socket.close();
  process.exit(ok ? 0 : 1);
}, 1800);
