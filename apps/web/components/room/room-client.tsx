'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@ifpc/ui';
import { endTrainingRoomAction } from '@/app/actions/training-rooms';
import {
  MEDIA_KIND,
  ROOM_HEARTBEAT_MS,
  decodeServerFrame,
  encodeClientFrame,
  type RtcParticipant,
  type RtcServerMessage,
} from '@ifpc/rtc-protocol';
import {
  AudioPlayer,
  AudioSender,
  VideoPlayer,
  VideoSender,
  canShareScreen,
  startLocalMedia,
  startScreenShare,
  stopStream,
} from './room-media';

export interface RoomClientProps {
  /** URL del servicio de salas (`ws://` en local, `wss://` en producción). */
  rtcUrl: string;
  /** Token de sala firmado por el servidor. */
  token: string;
  room: { id: string; title: string; maxParticipants: number };
  viewer: { userId: string; name: string; role: 'HOST' | 'GUEST' };
  /** ¿Se puede entrar ahora? */
  windowOpen: boolean;
  /** Explicación cuando no se puede (antes de la hora, terminada…). */
  closedMessage: string | null;
}

interface ChatLine {
  userId: string;
  name: string;
  text: string;
  at: string;
}

interface Peer {
  audio: AudioPlayer;
  video: VideoPlayer;
}

type Phase = 'idle' | 'connecting' | 'joined' | 'error';

/**
 * Sala de vídeo: habla con el servicio `rtc` por WebSocket, codifica lo propio y
 * pinta lo que llega. El servidor solo reenvía, así que aquí está todo el trabajo
 * de medios (ver `room-media.ts`).
 */
export function RoomClient({
  rtcUrl,
  token,
  room,
  viewer,
  windowOpen,
  closedMessage,
}: RoomClientProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [participants, setParticipants] = useState<RtcParticipant[]>([]);
  const [selfIndex, setSelfIndex] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [sharing, setSharing] = useState(false);
  /** Compartir pantalla no existe en todos los navegadores (móviles, sobre todo). */
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(canShareScreen());
  }, []);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const socket = useRef<WebSocket | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const audioSender = useRef<AudioSender | null>(null);
  const videoSender = useRef<VideoSender | null>(null);
  const peers = useRef(new Map<number, Peer>());
  const tiles = useRef(new Map<number, HTMLCanvasElement | null>());
  /** Índice de roster de cada usuario, para saber a quién cerrar cuando se va. */
  const indexByUser = useRef(new Map<string, number>());
  const heartbeat = useRef<number | null>(null);
  /** Salida voluntaria: no queremos pintar un error en ese caso. */
  const leaving = useRef(false);
  /** Pista de cámara guardada mientras se comparte pantalla. */
  const cameraTrack = useRef<MediaStreamTrack | null>(null);
  const counters = useRef({ sent: 0, received: 0, audioIn: 0, videoIn: 0 });
  /**
   * Última fase conocida. Vive en un ref porque `publishStats` también se llama
   * desde el manejador del socket (cada fotograma recibido), que se creó con el
   * estado de aquel momento: si leyera `phase` directo, publicaría una fase vieja.
   */
  const livePhase = useRef<Phase>('idle');
  const liveSelfIndex = useRef<number | null>(null);

  /** Contadores visibles para el panel de depuración y para los tests. */
  const publishStats = useCallback(() => {
    if (typeof window === 'undefined') return;
    (window as unknown as { __roomStats?: unknown }).__roomStats = {
      phase: livePhase.current,
      selfIndex: liveSelfIndex.current,
      peers: peers.current.size,
      ...counters.current,
    };
  }, []);

  useEffect(() => {
    livePhase.current = phase;
    liveSelfIndex.current = selfIndex;
    publishStats();
  }, [publishStats, participants.length, phase, selfIndex]);

  /** Crea (o recupera) los reproductores de un participante remoto. */
  const peerFor = useCallback((index: number): Peer => {
    const existing = peers.current.get(index);
    if (existing) return existing;

    const peer: Peer = { audio: new AudioPlayer(), video: new VideoPlayer() };
    peers.current.set(index, peer);

    const canvas = tiles.current.get(index);
    if (canvas) peer.video.attach(canvas);
    return peer;
  }, []);

  /** El tile avisa cuando existe su canvas (solo entonces se puede pintar). */
  const registerTile = useCallback(
    (index: number, canvas: HTMLCanvasElement | null) => {
      tiles.current.set(index, canvas);
      if (canvas) peerFor(index).video.attach(canvas);
    },
    [peerFor]
  );

  const send = useCallback((message: Record<string, unknown>) => {
    const socketRef = socket.current;
    if (socketRef?.readyState === WebSocket.OPEN) socketRef.send(JSON.stringify(message));
  }, []);

  /** Guarda el índice de cada participante y cierra a quien se va. */
  const remember = useCallback((rows: RtcParticipant[], selfId: string) => {
    for (const row of rows) {
      if (row.userId !== selfId) indexByUser.current.set(row.userId, row.index);
    }
  }, []);

  const handleServerMessage = useCallback(
    (message: RtcServerMessage) => {
      switch (message.t) {
        case 'welcome':
          setSelfIndex(message.self.index);
          setParticipants(message.participants);
          remember(message.participants, viewer.userId);
          // Pedimos un fotograma clave para que quien ya estaba nos vea.
          videoSender.current?.requestKeyframe();
          break;
        case 'roster':
          setParticipants(message.participants);
          remember(message.participants, viewer.userId);
          break;
        case 'joined':
          setParticipants((current) => [
            ...current.filter((row) => row.userId !== message.participant.userId),
            message.participant,
          ]);
          remember([message.participant], viewer.userId);
          videoSender.current?.requestKeyframe();
          break;
        case 'left': {
          setParticipants((current) => current.filter((row) => row.userId !== message.userId));
          const index = indexByUser.current.get(message.userId);
          if (index !== undefined) {
            const peer = peers.current.get(index);
            peer?.audio.close();
            peer?.video.close();
            peers.current.delete(index);
            indexByUser.current.delete(message.userId);
          }
          break;
        }
        case 'state':
          setParticipants((current) =>
            current.map((row) => (row.userId === message.participant.userId ? message.participant : row))
          );
          break;
        case 'chat':
          setChat((current) => [
            ...current.slice(-40),
            { userId: message.userId, name: message.name, text: message.text, at: message.at },
          ]);
          break;
        case 'error':
          setError(message.message);
          setPhase('error');
          break;
        case 'ended':
          setError('The host closed the room.');
          setPhase('error');
          break;
        default:
          break;
      }
    },
    [remember, viewer.userId]
  );

  /** Une el socket: primero el `hello` con el token, luego todo lo demás. */
  const enter = useCallback(async () => {
    setError(null);
    setPhase('connecting');

    try {
      stream.current = await startLocalMedia();
      if (localVideo.current) {
        localVideo.current.srcObject = stream.current;
        await localVideo.current.play().catch(() => undefined);
      }
    } catch {
      setError('We could not use your camera and microphone.');
      setPhase('error');
      return;
    }

    const ws = new WebSocket(rtcUrl);
    ws.binaryType = 'arraybuffer';
    socket.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', token }));

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        const frame = decodeServerFrame(new Uint8Array(event.data as ArrayBuffer));
        if (!frame) return;
        counters.current.received += 1;
        const peer = peerFor(frame.index);

        if (frame.kind === MEDIA_KIND.audio) {
          counters.current.audioIn += 1;
          peer.audio.push(frame.payload);
        } else {
          counters.current.videoIn += 1;
          peer.video.push(frame.payload);
        }
        publishStats();
        return;
      }

      const message = JSON.parse(event.data) as RtcServerMessage;
      // A partir del `welcome` arrancamos el envío: ya hay sala a la que mandar.
      if (message.t === 'welcome' && stream.current) {
        const sink = (kind: number, payload: Uint8Array) => {
          const socketRef = socket.current;
          if (socketRef?.readyState !== WebSocket.OPEN) return;
          counters.current.sent += 1;
          const seq = kind === MEDIA_KIND.audio ? audioSender.current?.nextSeq() ?? 0 : 0;
          socketRef.send(encodeClientFrame({ kind: kind as 1 | 2, seq, payload }));
        };

        audioSender.current = new AudioSender(stream.current, sink);
        videoSender.current = new VideoSender(sink);
        if (localVideo.current) videoSender.current.start(localVideo.current);
        for (const participant of message.participants) {
          if (participant.userId !== viewer.userId) peerFor(participant.index).audio.resume();
        }
        setPhase('joined');
      }

      handleServerMessage(message);
    };

    ws.onclose = (event) => {
      // Salida voluntaria: no es un error, solo volvemos a la pantalla previa.
      if (leaving.current) return;
      // Si el servidor ya explicó el motivo (expulsión, sala cerrada…), ese
      // mensaje se conserva: el cierre del socket no lo pisa.
      setError(
        (current) =>
          current ??
          (event.code === 4004 ? 'This room is full.' : 'Connection closed. Reload to rejoin.')
      );
      setPhase('error');
    };

    ws.onerror = () => {
      if (leaving.current) return;
      setError('We could not reach the room service.');
      setPhase('error');
    };
  }, [handleServerMessage, peerFor, publishStats, rtcUrl, token, viewer.userId]);

  /** Latido: el servidor da por caído a quien deja de avisar. */
  useEffect(() => {
    if (phase !== 'joined') return;

    heartbeat.current = window.setInterval(() => send({ t: 'ping' }), ROOM_HEARTBEAT_MS);
    return () => {
      if (heartbeat.current !== null) window.clearInterval(heartbeat.current);
    };
  }, [phase, send]);

  /** Salir: se cierra el socket (el servidor limpia la presencia) y los medios. */
  const leave = useCallback(() => {
    leaving.current = true;
    if (heartbeat.current !== null) window.clearInterval(heartbeat.current);
    socket.current?.close(1000, 'leave');
    socket.current = null;

    audioSender.current?.close();
    videoSender.current?.close();
    audioSender.current = null;
    videoSender.current = null;
    for (const peer of peers.current.values()) {
      peer.audio.close();
      peer.video.close();
    }
    peers.current.clear();
    indexByUser.current.clear();
    stopStream(stream.current);
    stream.current = null;
    setParticipants([]);
    setPhase('idle');
  }, []);

  /** Al desmontar (o cerrar la pestaña) no dejamos la cámara encendida. */
  useEffect(() => {
    return () => {
      if (socket.current) {
        leaving.current = true;
        socket.current.close(1000, 'unload');
        socket.current = null;
      }
      stopStream(stream.current);
      stream.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    audioSender.current?.setMuted(next);
    for (const track of stream.current?.getAudioTracks() ?? []) track.enabled = !next;
    send({ t: 'state', muted: next });
  }, [muted, send]);

  const toggleCamera = useCallback(() => {
    const next = !cameraOff;
    setCameraOff(next);
    videoSender.current?.setCameraOff(next);
    for (const track of stream.current?.getVideoTracks() ?? []) track.enabled = !next;
    send({ t: 'state', cameraOff: next });
  }, [cameraOff, send]);

  const toggleHand = useCallback(() => {
    const next = !handRaised;
    setHandRaised(next);
    send({ t: 'state', handRaised: next });
  }, [handRaised, send]);

  /** Deja de compartir y devuelve la cámara al stream local. */
  const stopScreenShare = useCallback(() => {
    const local = stream.current;
    const camera = cameraTrack.current;

    if (local) {
      for (const track of local.getVideoTracks()) {
        if (track === camera) continue;
        local.removeTrack(track);
        track.stop();
      }
      if (camera) local.addTrack(camera);
    }
    cameraTrack.current = null;

    if (localVideo.current) {
      localVideo.current.srcObject = local;
    }
    setSharing(false);
    send({ t: 'state', sharingScreen: false });
  }, [send]);

  /**
   * Compartir pantalla: cambiamos la pista de vídeo del stream local, así el
   * mismo camino (canvas → codificador → relay) manda la pantalla sin duplicar nada.
   */
  const startShareScreen = useCallback(async () => {
    const local = stream.current;
    if (!local) return;

    try {
      const display = await startScreenShare();
      const track = display.getVideoTracks()[0];
      if (!track) return;

      cameraTrack.current = local.getVideoTracks()[0] ?? null;
      if (cameraTrack.current) local.removeTrack(cameraTrack.current);
      local.addTrack(track);
      // El botón «Detener» del propio navegador también devuelve la cámara.
      track.onended = () => stopScreenShare();

      if (localVideo.current) localVideo.current.srcObject = local;
      setSharing(true);
      send({ t: 'state', sharingScreen: true });
    } catch {
      setError('Your browser did not allow sharing the screen.');
    }
  }, [send, stopScreenShare]);

  /** El host echa a alguien de la sala. */
  const removeParticipant = useCallback(
    (userId: string) => {
      send({ t: 'kick', userId });
    },
    [send]
  );

  /**
   * Cierre del host: se avisa al servicio (expulsa a todos al instante) y se
   * cierra la sala también en la base de datos, para que la lista quede coherente.
   */
  const endRoom = useCallback(() => {
    send({ t: 'end' });
    leave();
    const form = new FormData();
    form.set('roomId', room.id);
    void endTrainingRoomAction(form);
  }, [leave, room.id, send]);

  const sendChat = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    send({ t: 'chat', text });
    setDraft('');
  }, [draft, send]);

  const slots = Array.from({ length: room.maxParticipants }, (_, index) => index);

  /** Al entrar, el vídeo local vive ya en la rejilla: ahí se enganchan medios y envío. */
  useEffect(() => {
    if (phase !== 'joined') return;
    const video = localVideo.current;
    if (!video || !stream.current) return;

    video.srcObject = stream.current;
    void video.play().catch(() => undefined);
    videoSender.current?.start(video);
  }, [phase]);

  const controlClass =
    'rounded-xl border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5';

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{room.title}</h1>
          <p className="text-xs text-muted-foreground">
            {participants.length}/{room.maxParticipants} in the room
            {phase === 'joined' && selfIndex !== null ? ` · you are in slot ${selfIndex + 1}` : ''}
            {viewer.role === 'HOST' ? ' · you are the host' : ''}
          </p>
        </div>
        {phase === 'joined' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={toggleMute} aria-pressed={muted} className={controlClass}>
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button type="button" onClick={toggleCamera} className={controlClass}>
              {cameraOff ? 'Camera on' : 'Camera off'}
            </button>
            <button type="button" onClick={toggleHand} className={controlClass}>
              {handRaised ? 'Lower hand' : 'Raise hand'}
            </button>
            {canShare ? (
              <button
                type="button"
                onClick={() => (sharing ? stopScreenShare() : void startShareScreen())}
                className={controlClass}
              >
                {sharing ? 'Stop sharing' : 'Share screen'}
              </button>
            ) : null}
            {viewer.role === 'HOST' ? (
              <button type="button" onClick={endRoom} className={controlClass}>
                End room
              </button>
            ) : null}
            <Button variant="outline" onClick={leave}>
              Leave
            </Button>
          </div>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </p>
      ) : null}

      {phase === 'idle' || phase === 'connecting' ? (
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
            <video
              ref={localVideo}
              muted
              playsInline
              className="aspect-video w-full object-cover"
              data-testid="local-preview"
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              You
            </span>
          </div>
          {closedMessage ? <p className="text-sm text-muted-foreground">{closedMessage}</p> : null}
          <Button onClick={enter} disabled={!windowOpen || phase === 'connecting'}>
            {phase === 'connecting' ? 'Connecting…' : windowOpen ? 'Join the room' : 'Not open yet'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your browser will ask for camera and microphone permission. Nothing is recorded.
          </p>
        </div>
      ) : null}
      {phase === 'joined' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slots.map((slot) => {
            const participant = participants.find((row) => row.index === slot);
            const isSelf = participant?.userId === viewer.userId;

            return (
              <div
                key={slot}
                className="relative overflow-hidden rounded-2xl border border-border bg-black/60"
                data-testid={`tile-${slot}`}
              >
                {isSelf ? (
                  <video
                    ref={localVideo}
                    muted
                    playsInline
                    className="aspect-video w-full object-cover"
                  />
                ) : participant ? (
                  <canvas
                    ref={(node) => registerTile(slot, node)}
                    width={480}
                    height={360}
                    className="aspect-video w-full"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center text-xs text-muted-foreground">
                    Free slot
                  </div>
                )}
                {participant ? (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/50 px-2 py-1 text-xs text-white">
                    <span className="truncate">
                      {participant.name}
                      {isSelf ? ' (you)' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      {participant.sharingScreen ? <span title="Sharing screen">🖥️</span> : null}
                      {participant.handRaised ? <span title="Hand raised">✋</span> : null}
                      {participant.muted ? <span title="Muted">🔇</span> : null}
                      {participant.cameraOff ? <span title="Camera off">📷</span> : null}
                      {viewer.role === 'HOST' && !isSelf ? (
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant.userId)}
                          className="rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80 hover:text-white"
                          data-testid={`remove-${slot}`}
                        >
                          Remove
                        </button>
                      ) : null}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {phase === 'joined' ? (
        <section className="flex flex-col gap-2 rounded-2xl border border-border p-3">
          <h2 className="text-sm font-semibold">Chat</h2>
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-sm" data-testid="chat">
            {chat.length === 0 ? (
              <li className="text-xs text-muted-foreground">No messages yet.</li>
            ) : null}
            {chat.map((line, index) => (
              <li key={`${line.at}-${index}`}>
                <span className="font-medium">{line.name}:</span>{' '}
                <span className="text-muted-foreground">{line.text}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendChat();
              }}
              placeholder="Message…"
              aria-label="Message"
              className="h-10 flex-1 rounded-xl border border-border bg-transparent px-3 text-sm"
            />
            <Button variant="outline" onClick={sendChat}>
              Send
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}


