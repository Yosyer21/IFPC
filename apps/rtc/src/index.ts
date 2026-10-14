import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  ROOM_HEARTBEAT_MS,
  decodeClientFrame,
  pairKey,
  readPeerSignal,
  type RtcClientMessage,
} from '@ifpc/rtc-protocol';
import { roomTokenSecret, verifyRoomToken, type RoomTokenPayload } from '@ifpc/rtc-protocol/token';
import { markEnded, markJoined, markLeft, markState } from './persistence';
import { RoomRegistry, type MemberSocket } from './room';

/**
 * Servicio de salas de vídeo del Football Center.
 *
 * Por aquí pasan la señalización, la presencia y **los medios** (transporte
 * `relay`: el cliente codifica y nosotros reenviamos, nunca transcodificamos).
 * Corre como servicio aparte del web porque Next.js (App Router) no puede aceptar
 * el `upgrade` de un WebSocket.
 *
 * Variables: `PORT`, `ROOM_TOKEN_SECRET` (o `AUTH_SECRET`) y `DATABASE_URL`.
 */
const PORT = Number(process.env.PORT ?? 4001);
const HELLO_TIMEOUT_MS = 10_000;
/** Señalización permitida por conexión cada 10 s (una negociación gasta decenas). */
const SIGNAL_BUDGET_PER_WINDOW = 240;
const secret = roomTokenSecret();

const registry = new RoomRegistry();

/** Envuelve un socket de `ws` en lo poco que la sala necesita. */
function memberSocket(socket: WebSocket): MemberSocket {
  return {
    send: (message) => {
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
    },
    sendBinary: (frame) => {
      if (socket.readyState === socket.OPEN) socket.send(frame, { binary: true });
    },
    close: (code, reason) => socket.close(code, reason),
  };
}

/** El `hello` puede llegar como JSON `{t:'hello',token}` o como token pelado. */
function readToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('{')) return trimmed;

  try {
    const parsed = JSON.parse(trimmed) as { t?: string; token?: string };
    return parsed.t === 'hello' && typeof parsed.token === 'string' ? parsed.token : null;
  } catch {
    return null;
  }
}

const server = createServer((req, res) => {
  // Healthcheck para Railway y para comprobar que el servicio está vivo. El
  // `railway.json` del repo comprueba `/`, así que esa ruta también responde 200.
  if (req.url?.startsWith('/healthz') || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'rtc', rooms: registry.list().length }));
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('WebSocket endpoint');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  let payload: RoomTokenPayload | null = null;

  const helloTimer = setTimeout(() => {
    if (!payload) socket.close(4003, 'no-hello');
  }, HELLO_TIMEOUT_MS);

  socket.on('message', (data, isBinary) => {
    // 1) Primer mensaje: `hello` con el token firmado por la web.
    if (!payload) {
      if (isBinary) return;
      const token = readToken(data.toString());
      const verified = token ? verifyRoomToken(token, secret) : null;
      if (!verified) {
        socket.send(
          JSON.stringify({ t: 'error', code: 'unauthorized', message: 'Invalid room token.' })
        );
        socket.close(4003, 'unauthorized');
        return;
      }

      payload = verified;
      clearTimeout(helloTimer);

      const result = registry.join({
        roomId: verified.roomId,
        title: verified.title,
        maxParticipants: verified.maxParticipants,
        userId: verified.userId,
        name: verified.name,
        role: verified.role,
        transport: 'relay',
        socket: memberSocket(socket),
      });

      if (!result.ok) {
        socket.send(JSON.stringify({ t: 'error', code: result.code, message: result.message }));
        socket.close(4004, result.code);
        return;
      }

      socket.send(
        JSON.stringify({
          t: 'welcome',
          room: {
            id: verified.roomId,
            title: verified.title,
            maxParticipants: verified.maxParticipants,
          },
          self: { userId: verified.userId, role: verified.role, index: result.member.index },
          participants: result.participants,
        })
      );
      void markJoined({
        roomId: verified.roomId,
        userId: verified.userId,
        role: verified.role,
        transport: 'relay',
      });
      console.log(`[rtc] ${verified.name} entró en ${verified.roomId}`);
      return;
    }

    // 2) Medios: binario con cabecera corta; el resto es control en JSON.
    if (isBinary) {
      const frame = decodeClientFrame(new Uint8Array(data as Buffer));
      if (frame) registry.relay(payload.roomId, payload.userId, frame);
      return;
    }

    handleControl(payload, data.toString());
  });

  socket.on('close', () => {
    clearTimeout(helloTimer);
    if (!payload) return;
    registry.leave(payload.roomId, payload.userId);
    void markLeft(payload.roomId, payload.userId);
  });

  // El cierre limpia; aquí solo evitamos que un socket roto tumbe el proceso.
  socket.on('error', () => undefined);

  /**
   * Presupuesto de señalización por conexión: una negociación WebRTC gasta unas
   * pocas decenas de mensajes, así que este margen no molesta a nadie y corta el
   * abuso desde el primer momento.
   */
  let signalWindowAt = 0;
  let signalWindowCount = 0;
  function withinSignalBudget(): boolean {
    const stamp = Date.now();
    if (stamp - signalWindowAt > 10_000) {
      signalWindowAt = stamp;
      signalWindowCount = 0;
    }
    signalWindowCount += 1;
    if (signalWindowCount > SIGNAL_BUDGET_PER_WINDOW) {
      if (signalWindowCount === SIGNAL_BUDGET_PER_WINDOW + 1) {
        console.log(`[rtc] demasiada señalización de ${payload?.userId ?? 'desconocido'}`);
      }
      return false;
    }
    return true;
  }

  function handleControl(current: RoomTokenPayload, raw: string): void {
    let message: RtcClientMessage;
    try {
      message = JSON.parse(raw) as RtcClientMessage;
    } catch {
      socket.send(
        JSON.stringify({ t: 'error', code: 'bad-message', message: 'Malformed message.' })
      );
      return;
    }

    switch (message.t) {
      case 'state': {
        const patch = {
          muted: message.muted,
          cameraOff: message.cameraOff,
          handRaised: message.handRaised,
          sharingScreen: message.sharingScreen,
        };
        registry.updateState(current.roomId, current.userId, patch);
        void markState(current.roomId, current.userId, patch);
        break;
      }
      case 'chat':
        registry.chat(current.roomId, current.userId, message.text ?? '');
        break;
      case 'kick':
        registry.kick(current.roomId, current.userId, message.userId);
        break;
      // Señalización WebRTC: el servicio solo la reenvía a quien va dirigida.
      case 'p2p-offer':
      case 'p2p-answer':
      case 'p2p-ice': {
        if (!withinSignalBudget()) break;
        const signal = readPeerSignal(message);
        if (signal) registry.signal(current.roomId, current.userId, signal);
        break;
      }
      // «Con este voy directo»: hasta que los dos lo digan, seguimos reenviando.
      case 'p2p-direct': {
        const peerUserId = message.userId;
        if (!peerUserId || typeof message.direct !== 'boolean') break;
        const result = registry.setDirect(
          current.roomId,
          current.userId,
          peerUserId,
          message.direct
        );
        if (result.changed) {
          console.log(
            `[rtc] ${pairKey(current.userId, peerUserId)} ${
              result.direct ? 'va por la vía directa' : 'vuelve al relay'
            } en ${current.roomId}`
          );
        }
        break;
      }
      case 'end':
        if (registry.end(current.roomId, current.userId)) {
          void markEnded(current.roomId);
          console.log(`[rtc] ${current.name} cerró ${current.roomId}`);
        }
        break;
      case 'ping':
        // El latido también cuenta como señal de vida (si no, el barrido lo saca).
        registry.heartbeat(current.roomId, current.userId);
        socket.send(JSON.stringify({ t: 'pong' }));
        break;
      default:
        break;
    }
  }
});

// Barrido de caídos: quien no late (pestaña cerrada de golpe, red perdida) sale.
setInterval(() => {
  for (const dropped of registry.sweep()) {
    console.log(`[rtc] ${dropped.userId} fuera de ${dropped.roomId} por falta de latido`);
    void markLeft(dropped.roomId, dropped.userId);
  }
}, ROOM_HEARTBEAT_MS).unref();

server.listen(PORT, () => {
  console.log(
    `[rtc] salas escuchando en :${PORT} (secreto propio: ${
      process.env.ROOM_TOKEN_SECRET ? 'sí' : 'no, usando respaldo'
    })`
  );
});

/** Apagado limpio: Railway manda SIGTERM al redesplegar. */
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.log(`[rtc] ${signal}: avisando a las salas y cerrando`);
    for (const room of registry.list()) {
      for (const member of room.members.values()) {
        member.socket.send({ t: 'ended' });
        member.socket.close(4001, 'server-restart');
      }
    }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2_000).unref();
  });
}
