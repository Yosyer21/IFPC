import {
  MEDIA_KIND,
  ROOM_AUDIO_BITRATE,
  ROOM_VIDEO_BITRATE,
  ROOM_VIDEO_FPS,
  ROOM_VIDEO_HEIGHT,
  ROOM_VIDEO_WIDTH,
  type MediaKind,
} from '@ifpc/rtc-protocol';

/**
 * Medios de la sala: capturamos, codificamos y reproducimos en el navegador. El
 * servicio solo reenvía bytes, así que aquí está todo el trabajo pesado.
 *
 * Dos caminos, elegidos por capacidades del navegador:
 * - **WebCodecs** (Chrome/Edge/Safari 16.4+/Firefox recientes): Opus + VP8.
 * - **Respaldo** sin WebCodecs: PCM crudo (16 bits) + fotogramas JPEG a pocos fps.
 *
 * En los dos casos el receptor dibuja en un `<canvas>`, así la rejilla no cambia.
 */

export interface MediaCapabilities {
  audioCodec: boolean;
  videoCodec: boolean;
}

/** ¿Qué sabemos hacer en este navegador? */
export function mediaCapabilities(): MediaCapabilities {
  const scope = globalThis as unknown as { AudioEncoder?: unknown; VideoEncoder?: unknown };
  return {
    audioCodec: typeof scope.AudioEncoder === 'function',
    videoCodec: typeof scope.VideoEncoder === 'function',
  };
}

/** Captura local: micro con cancelación de eco y cámara a resolución de sala. */
export async function startLocalMedia(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: {
      width: { ideal: ROOM_VIDEO_WIDTH },
      height: { ideal: ROOM_VIDEO_HEIGHT },
      frameRate: { ideal: ROOM_VIDEO_FPS, max: ROOM_VIDEO_FPS },
    },
  });
}

/** Suelta un stream (al salir o al cambiar de cámara). */
export function stopStream(stream: MediaStream | null): void {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

type FrameSink = (kind: MediaKind, payload: Uint8Array) => void;

const now = () => performance.now();

/**
 * Envía el audio propio: PCM de un `ScriptProcessorNode` (simple y universal) y,
 * si hay `AudioEncoder`, lo comprime a Opus antes de mandarlo.
 */
export class AudioSender {
  private readonly context: AudioContext;
  private readonly processor: ScriptProcessorNode;
  private readonly source: MediaStreamAudioSourceNode;
  private readonly encoder: AudioEncoder | null;
  private seq = 0;
  muted = false;

  constructor(stream: MediaStream, private readonly sink: FrameSink) {
    this.context = new AudioContext();
    this.source = this.context.createMediaStreamSource(stream);
    this.processor = this.context.createScriptProcessor(2048, 1, 1);

    this.encoder = mediaCapabilities().audioCodec
      ? new AudioEncoder({
          output: (chunk) => {
            const payload = new Uint8Array(chunk.byteLength);
            chunk.copyTo(payload);
            this.sink(MEDIA_KIND.audio, payload);
          },
          error: () => undefined,
        })
      : null;
    this.encoder?.configure({
      codec: 'opus',
      sampleRate: this.context.sampleRate,
      numberOfChannels: 1,
      bitrate: ROOM_AUDIO_BITRATE,
    });

    this.processor.onaudioprocess = (event) => this.onAudio(event);
    this.source.connect(this.processor);
    // El ScriptProcessor solo se ejecuta si llega a un nodo: lo cerramos en un
    // gain a cero para no oírnos a nosotros mismos.
    const silent = this.context.createGain();
    silent.gain.value = 0;
    this.processor.connect(silent);
    silent.connect(this.context.destination);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Número de frame, para depurar pérdidas desde la consola. */
  nextSeq(): number {
    this.seq += 1;
    return this.seq;
  }

  close(): void {
    try {
      this.encoder?.close();
      this.processor.disconnect();
      this.source.disconnect();
      void this.context.close();
    } catch {
      // Cerrando: da igual lo que falle aquí.
    }
  }

  private onAudio(event: AudioProcessingEvent): void {
    if (this.muted) return;

    const samples = event.inputBuffer.getChannelData(0);
    if (this.encoder) {
      this.encoder.encode(
        new AudioData({
          format: 'f32-planar',
          sampleRate: this.context.sampleRate,
          numberOfFrames: samples.length,
          numberOfChannels: 1,
          timestamp: Math.round(now() * 1000),
          data: samples.slice(),
        })
      );
      return;
    }

    // Respaldo sin códec: mandamos los samples tal cual (mono, 16 bits).
    const pcm = new Uint8Array(samples.length * 2);
    const view = new DataView(pcm.buffer);
    for (let index = 0; index < samples.length; index += 1) {
      const value = Math.max(-1, Math.min(1, samples[index] ?? 0));
      view.setInt16(index * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
    }
    this.sink(MEDIA_KIND.audio, pcm);
  }
}


/**
 * Reproduce el audio de **un** participante. Mantiene un pequeño colchón para que
 * los bloques no se solapen ni suenen a tirones.
 */
export class AudioPlayer {
  private readonly context: AudioContext;
  private readonly decoder: AudioDecoder | null;
  private nextPlayAt = 0;
  private sampleRate = 48_000;

  constructor() {
    this.context = new AudioContext();
    this.decoder = mediaCapabilities().audioCodec
      ? new AudioDecoder({
          output: (data) => this.play(data),
          error: () => undefined,
        })
      : null;
    this.decoder?.configure({ codec: 'opus', sampleRate: this.sampleRate, numberOfChannels: 1 });
  }

  /** iOS/Safari exigen un gesto del usuario para sacar audio: se reanuda al entrar. */
  resume(): void {
    void this.context.resume();
  }

  push(payload: Uint8Array): void {
    if (this.decoder) {
      this.decoder.decode(
        new EncodedAudioChunk({ type: 'key', timestamp: Math.round(now() * 1000), data: payload })
      );
      return;
    }

    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const samples = new Float32Array(Math.floor(payload.byteLength / 2));
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = view.getInt16(index * 2, true) / 0x8000;
    }

    const buffer = this.context.createBuffer(1, samples.length, this.sampleRate);
    buffer.copyToChannel(samples, 0);
    this.schedule(buffer, buffer.duration);
  }

  close(): void {
    try {
      this.decoder?.close();
      void this.context.close();
    } catch {
      // Cerrando.
    }
  }

  private play(data: AudioData): void {
    const samples = new Float32Array(data.numberOfFrames);
    data.copyTo(samples, { planeIndex: 0, format: 'f32-planar' });
    this.sampleRate = data.sampleRate;

    const buffer = this.context.createBuffer(1, data.numberOfFrames, data.sampleRate);
    buffer.copyToChannel(samples, 0);
    this.schedule(buffer, data.numberOfFrames / data.sampleRate);
    data.close();
  }

  /** Agenda el bloque pegado al anterior (colchón de 80 ms la primera vez). */
  private schedule(buffer: AudioBuffer, duration: number): void {
    const start = Math.max(this.nextPlayAt, this.context.currentTime + 0.08);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(start);
    this.nextPlayAt = start + duration;
  }
}

/**
 * Envía el vídeo propio: dibuja la cámara en un canvas fuera de pantalla y lo
 * codifica (VP8). Sin WebCodecs manda fotogramas JPEG a pocos fps.
 */
export class VideoSender {
  private readonly canvas: HTMLCanvasElement;
  private readonly encoder: VideoEncoder | null;
  private timer: number | null = null;
  private seq = 0;
  private running = false;
  /** Fuerza un fotograma clave en el siguiente frame (para quien acaba de entrar). */
  private forceKeyframe = false;
  /** Sin cámara: no gastamos ancho de banda. */
  cameraOff = false;

  constructor(private readonly sink: FrameSink) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = ROOM_VIDEO_WIDTH;
    this.canvas.height = ROOM_VIDEO_HEIGHT;

    this.encoder = mediaCapabilities().videoCodec
      ? new VideoEncoder({
          output: (chunk) => {
            const payload = new Uint8Array(chunk.byteLength);
            chunk.copyTo(payload);
            this.sink(MEDIA_KIND.video, payload);
          },
          error: () => undefined,
        })
      : null;
    this.encoder?.configure({
      codec: 'vp8',
      width: ROOM_VIDEO_WIDTH,
      height: ROOM_VIDEO_HEIGHT,
      bitrate: ROOM_VIDEO_BITRATE,
      framerate: ROOM_VIDEO_FPS,
      latencyMode: 'realtime',
    });
  }

  setCameraOff(cameraOff: boolean): void {
    this.cameraOff = cameraOff;
  }

  /**
   * Pide un fotograma clave en el siguiente frame: cuando alguien entra a la sala
   * necesita uno para empezar a decodificar (si no, vería negro hasta el siguiente).
   */
  requestKeyframe(): void {
    this.forceKeyframe = true;
  }

  /** Arranca el bucle de captura desde el `<video>` local. */
  start(video: HTMLVideoElement): void {
    if (this.running) return;
    this.running = true;

    const context = this.canvas.getContext('2d');
    const interval = this.encoder ? Math.round(1000 / ROOM_VIDEO_FPS) : 200;

    this.timer = window.setInterval(() => {
      if (!context || this.cameraOff || video.videoWidth === 0) return;
      // Codificador saturado: mejor saltar frames que acumular latencia.
      if (this.encoder && this.encoder.encodeQueueSize > 4) return;

      context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      this.seq += 1;

      if (this.encoder) {
        const keyFrame = this.forceKeyframe || this.seq % 30 === 1;
        this.forceKeyframe = false;
        this.encoder.encode(new VideoFrame(this.canvas, { timestamp: Math.round(now() * 1000) }), {
          keyFrame,
        });
        return;
      }

      this.canvas.toBlob(
        (blob) => {
          if (!blob) return;
          void blob.arrayBuffer().then((data) => this.sink(MEDIA_KIND.video, new Uint8Array(data)));
        },
        'image/jpeg',
        0.5
      );
    }, interval);
  }

  close(): void {
    this.running = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    try {
      this.encoder?.close();
    } catch {
      // Cerrando.
    }
  }
}

/**
 * Reproduce el vídeo de un participante en el canvas de su tile. Los frames llegan
 * en VP8 (WebCodecs) o en JPEG (respaldo) y acaban igual: dibujados.
 */
export class VideoPlayer {
  private readonly decoder: VideoDecoder | null;
  private canvas: HTMLCanvasElement | null = null;
  /** Frame que llegó antes de que el tile existiera. */
  private pending: Uint8Array | null = null;
  private seq = 0;
  /** Frames pintados: lo miran el panel de depuración y los tests. */
  frames = 0;

  constructor() {
    this.decoder = mediaCapabilities().videoCodec
      ? new VideoDecoder({
          output: (frame) => this.draw(frame),
          error: () => undefined,
        })
      : null;
    this.decoder?.configure({ codec: 'vp8', optimizeForLatency: true });
  }

  /** El tile avisa de su canvas; si había un frame esperando, se pinta ya. */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    if (this.pending) {
      const payload = this.pending;
      this.pending = null;
      this.push(payload);
    }
  }

  push(payload: Uint8Array): void {
    if (!this.canvas) {
      this.pending = payload;
      return;
    }

    this.seq += 1;
    if (this.decoder) {
      this.decoder.decode(
        new EncodedVideoChunk({
          type: 'key',
          timestamp: Math.round(now() * 1000),
          data: payload,
        })
      );
      return;
    }

    void createImageBitmap(new Blob([payload.slice()], { type: 'image/jpeg' })).then((bitmap) => {
      const context = this.canvas?.getContext('2d');
      if (context && this.canvas) {
        context.drawImage(bitmap, 0, 0, this.canvas.width, this.canvas.height);
        this.frames += 1;
      }
      bitmap.close();
    });
  }

  close(): void {
    try {
      this.decoder?.close();
    } catch {
      // Cerrando.
    }
  }

  private draw(frame: VideoFrame): void {
    const context = this.canvas?.getContext('2d');
    if (context && this.canvas) {
      context.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
      this.frames += 1;
    }
    frame.close();
  }
}

