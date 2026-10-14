'use client';

import {
  MEDIA_KIND,
  P2P_CONNECT_TIMEOUT_MS,
  P2P_MAX_ATTEMPTS,
  P2P_RETRY_MS,
  decodeClientFrame,
  encodeClientFrame,
  isPolitePeer,
  type IceCandidateWire,
  type MediaKind,
  type RtcClientMessage,
  type RtcServerMessage,
} from '@ifpc/rtc-protocol';

/**
 * Vía directa entre dos navegadores (WebRTC) usando el servicio de salas **solo**
 * como intermediario de la señalización: los frames que ya codificamos viajan por
 * *data channels*, de navegador a navegador, sin pasar por nuestros servidores.
 *
 * Es **oportunista y sin infraestructura extra**: no hay STUN ni TURN (nada
 * externo), así que si las dos redes no se ven, el enlace no conecta y se sigue
 * por el relay como si nada; y si se cae a mitad de llamada, también.
 *
 * El receptor no distingue de dónde viene el frame: `onFrame` devuelve el mismo
 * `[kind][seq][payload]` que llega por el relay, así que la rejilla, los códecs y
 * los reproductores siguen siendo los mismos.
 */

/** Cómo va la vía directa con alguien: `trying` mientras se negocia. */
export type PeerTransport = 'direct' | 'relay' | 'trying';

export interface P2PMeshOptions {
  /** Id propio: decide quién cede en un choque de ofertas (`polite`). */
  selfId: string;
  /** Manda señalización por el WebSocket de la sala. */
  signal: (message: RtcClientMessage) => void;
  /** Frame que llegó por la vía directa (mismo formato que el del relay). */
  onFrame: (userId: string, kind: MediaKind, payload: Uint8Array) => void;
  /** Cambió el estado de un enlace (insignia y contadores). */
  onState: (userId: string, transport: PeerTransport) => void;
  /** ¿Intentamos la vía directa? (`?p2p=off` la desactiva del todo). */
  enabled: boolean;
}

interface Link {
  peerId: string;
  pc: RTCPeerConnection;
  audio: RTCDataChannel | null;
  video: RTCDataChannel | null;
  state: PeerTransport;
  /** Intentos gastados tras un fallo. */
  attempts: number;
  /** Candidatos que llegaron antes que la oferta. */
  pending: RTCIceCandidateInit[];
  makingOffer: boolean;
  retry: number | null;
  /** Si nadie conecta en unos segundos, seguimos por el relay sin más. */
  watchdog: number | null;
  /** El servicio ya sabe que este par va directo (para no repetirlo). */
  announced: boolean;
  /** Frames que han llegado por esta vía (panel de depuración y tests). */
  received: number;
}

export class P2PMesh {
  private readonly links = new Map<string, Link>();
  private closed = false;

  constructor(private readonly options: P2PMeshOptions) {}

  /** ¿Este navegador puede intentarlo? */
  static supported(): boolean {
    return typeof RTCPeerConnection === 'function';
  }

  /** Enlaces que van directos ahora mismo. */
  get directCount(): number {
    let count = 0;
    for (const link of this.links.values()) {
      if (link.state === 'direct') count += 1;
    }
    return count;
  }

  /** Frames recibidos por la vía directa, sumando todos los enlaces. */
  get received(): number {
    let total = 0;
    for (const link of this.links.values()) total += link.received;
    return total;
  }

  /**
   * Estado de cada enlace directo, para el panel de depuración y los tests: si
   * algo no conecta, aquí se ve en qué punto se quedó.
   */
  debug(): Record<
    string,
    {
      state: PeerTransport;
      connection: string;
      ice: string;
      signal: string;
      local: string;
      remote: string;
    }
  > {
    const rows: Record<
      string,
      {
        state: PeerTransport;
        connection: string;
        ice: string;
        signal: string;
        local: string;
        remote: string;
      }
    > = {};
    for (const [userId, link] of this.links) {
      rows[userId] = {
        state: link.state,
        connection: link.pc.connectionState,
        ice: link.pc.iceConnectionState,
        signal: link.pc.signalingState,
        local: link.pc.localDescription?.type ?? '-',
        remote: link.pc.remoteDescription?.type ?? '-',
      };
    }
    return rows;
  }

  /** Abre (o retoma) la vía directa con alguien del roster. */
  add(userId: string): void {
    if (this.closed || !this.options.enabled) return;
    if (userId === this.options.selfId || this.links.has(userId)) return;
    // Solo empuja el de id menor: el otro espera la oferta y contesta. Así los dos
    // no ofrecen a la vez (*glare*) y la negociación es siempre igual.
    if (isPolitePeer(this.options.selfId, userId)) return;
    this.create(userId);
  }

  /** Alguien se va: fuera su enlace. */
  remove(userId: string): void {
    const link = this.links.get(userId);
    if (!link) return;
    this.links.delete(userId);
    this.teardown(link);
  }

  /** Se acabó la llamada. */
  close(): void {
    this.closed = true;
    for (const link of this.links.values()) this.teardown(link);
    this.links.clear();
  }

  /**
   * Manda un frame propio por la vía directa (el frame se codifica una sola vez,
   * aunque vaya a varios). Devuelve a cuántos llegó.
   */
  send(kind: MediaKind, payload: Uint8Array): number {
    if (this.closed) return 0;

    let frame: Uint8Array<ArrayBuffer> | null = null;
    let delivered = 0;

    for (const link of this.links.values()) {
      if (link.state !== 'direct') continue;
      const channel = kind === MEDIA_KIND.audio ? link.audio : link.video;
      if (channel?.readyState !== 'open') continue;

      // Por la vía directa el seq no se usa (cada canal es de un solo emisor).
      frame ??= encodeClientFrame({ kind, seq: 0, payload });
      try {
        channel.send(frame);
        delivered += 1;
      } catch {
        // Canal cerrado en mal momento: el relay sigue cubriendo este enlace.
      }
    }
    return delivered;
  }

  /**
   * Aplica una señal que viene del servicio. Se usa el patrón *perfect
   * negotiation*: los dos lados pueden ofrecer a la vez (los dos ven al otro a la
   * vez) y el id menor cede, así que nunca se quedan trabados.
   */
  async handle(message: RtcServerMessage): Promise<void> {
    if (this.closed || !this.options.enabled) return;
    if (message.t !== 'p2p-offer' && message.t !== 'p2p-answer' && message.t !== 'p2p-ice') {
      return;
    }

    const peerId: string = message.from;
    // Una oferta puede adelantarse al roster: en ese caso abrimos el enlace aquí
    // (es el caso normal del lado que no empuja: ver `add`).
    const link = this.links.get(peerId) ?? (message.t === 'p2p-offer' ? this.create(peerId) : null);
    if (!link) return;

    try {
      if (message.t === 'p2p-ice') {
        // `null` es «se me acabaron los candidatos»: no hay nada que añadir.
        if (!message.candidate) return;
        await this.addCandidate(link, message.candidate);
        return;
      }

      const description: RTCSessionDescriptionInit = {
        type: message.t === 'p2p-offer' ? 'offer' : 'answer',
        sdp: message.sdp,
      };
      const collision =
        description.type === 'offer' && (link.makingOffer || link.pc.signalingState !== 'stable');
      if (collision && !isPolitePeer(this.options.selfId, peerId)) return;

      await link.pc.setRemoteDescription(description);
      for (const candidate of link.pending.splice(0)) {
        await link.pc.addIceCandidate(candidate).catch(() => undefined);
      }

      if (description.type === 'offer') {
        await link.pc.setLocalDescription();
        const sdp = link.pc.localDescription?.sdp;
        if (sdp) this.signal({ t: 'p2p-answer', to: peerId, sdp });
      }
    } catch {
      // La conexión se cerró a mitad de la negociación; el estado la reintenta.
    }
  }

  private create(peerId: string): Link {
    // Sin servidores ICE externos: o las dos redes se ven a través de sus propios
    // candidatos, o seguimos por el relay (que es lo que ya funcionaba).
    const pc = new RTCPeerConnection({ iceServers: [] });
    const link: Link = {
      peerId,
      pc,
      audio: null,
      video: null,
      state: 'trying',
      attempts: 0,
      pending: [],
      makingOffer: false,
      retry: null,
      watchdog: null,
      announced: false,
      received: 0,
    };
    this.links.set(peerId, link);

    pc.onnegotiationneeded = () => void this.offer(link);
    pc.onicecandidate = (event) => {
      this.signal({
        t: 'p2p-ice',
        to: peerId,
        candidate: event.candidate ? toWire(event.candidate) : null,
      });
    };
    pc.onconnectionstatechange = () => this.onConnectionState(link);
    pc.ondatachannel = (event) => this.attach(link, event.channel);

    // Audio fiable (32 kbps: poco que perder) y vídeo sin retransmisión: mejor
    // perder un frame que acumular latencia.
    this.attach(link, pc.createDataChannel('audio', { ordered: true }));
    this.attach(link, pc.createDataChannel('video', { ordered: false, maxRetransmits: 0 }));

    // Si en unos segundos no hay camino directo, esto se queda en el relay y aquí
    // no ha pasado nada: la llamada nunca dependió de esta vía.
    link.watchdog = window.setTimeout(() => {
      if (link.state === 'direct') return;
      link.state = 'relay';
      this.announce(link, false);
      this.options.onState(peerId, 'relay');
    }, P2P_CONNECT_TIMEOUT_MS);

    this.options.onState(peerId, 'trying');
    return link;
  }

  private async offer(link: Link): Promise<void> {
    if (this.closed) return;
    try {
      link.makingOffer = true;
      await link.pc.setLocalDescription();
      const sdp = link.pc.localDescription?.sdp;
      if (sdp) this.signal({ t: 'p2p-offer', to: link.peerId, sdp });
    } catch {
      // Sin descripción local no hay oferta; el estado de la conexión decide.
    } finally {
      link.makingOffer = false;
    }
  }

  /** Los dos canales del enlace: uno para audio y otro para vídeo. */
  private attach(link: Link, channel: RTCDataChannel): void {
    if (channel.label === 'audio') link.audio = channel;
    else link.video = channel;

    channel.binaryType = 'arraybuffer';
    channel.onopen = () => this.checkConnected(link);
    channel.onmessage = (event) => {
      if (typeof event.data === 'string') return;
      const frame = decodeClientFrame(new Uint8Array(event.data as ArrayBuffer));
      if (!frame) return;

      link.received += 1;
      this.options.onFrame(link.peerId, frame.kind, frame.payload);
    };
    channel.onclose = () => {
      if (link.audio?.readyState !== 'open' && link.video?.readyState !== 'open') this.fail(link);
    };
  }

  private async addCandidate(link: Link, candidate: IceCandidateWire): Promise<void> {
    if (!link.pc.remoteDescription) {
      link.pending.push(candidate);
      return;
    }
    await link.pc.addIceCandidate(candidate).catch(() => undefined);
  }

  /** Cómo va cada enlace (lo pintan las insignias de la rejilla). */
  transports(): Record<string, PeerTransport> {
    const current: Record<string, PeerTransport> = {};
    for (const [userId, link] of this.links) current[userId] = link.state;
    return current;
  }

  /** El enlace es directo cuando un canal está abierto de verdad, no antes. */
  private checkConnected(link: Link): void {
    if (link.pc.connectionState !== 'connected') return;
    if (link.audio?.readyState !== 'open' && link.video?.readyState !== 'open') return;
    if (link.state === 'direct') return;

    link.state = 'direct';
    link.attempts = 0;
    if (link.watchdog !== null) window.clearTimeout(link.watchdog);
    link.watchdog = null;
    this.announce(link, true);
    this.options.onState(link.peerId, 'direct');
  }

  private onConnectionState(link: Link): void {
    const state = link.pc.connectionState;
    if (state === 'connected') {
      this.checkConnected(link);
      return;
    }

    if (state === 'failed' || state === 'closed') {
      this.fail(link);
      return;
    }

    // `disconnected` suele ser pasajero: mientras tanto vuelve el relay.
    if (state === 'disconnected' && link.state === 'direct') {
      link.state = 'relay';
      this.announce(link, false);
      this.options.onState(link.peerId, 'relay');
    }
  }

  /**
   * La vía directa no va: se queda en el relay (la llamada sigue sin enterarse) y,
   * si quedan intentos, se prueba otra vez un poco más tarde por si fue la red.
   */
  private fail(link: Link): void {
    if (this.closed) return;
    if (link.watchdog !== null) window.clearTimeout(link.watchdog);
    link.watchdog = null;
    link.state = 'relay';
    this.announce(link, false);

    const retrying = link.attempts < P2P_MAX_ATTEMPTS;
    this.options.onState(link.peerId, retrying ? 'trying' : 'relay');
    if (!retrying) return;

    link.attempts += 1;
    const peerId = link.peerId;
    link.retry = window.setTimeout(() => {
      // Enlace nuevo desde cero: puede que la red de antes ya no exista.
      if (this.links.get(peerId) === link) this.links.delete(peerId);
      this.teardown(link);
      if (!this.closed) this.create(peerId);
    }, P2P_RETRY_MS);
  }

  /**
   * Avisa al servicio de que este par va directo (o de que ha dejado de ir): solo
   * cuando lo dicen los dos lados se retira del relay.
   */
  private announce(link: Link, direct: boolean): void {
    if (direct === link.announced) return;
    link.announced = direct;
    this.signal({ t: 'p2p-direct', userId: link.peerId, direct });
  }

  private signal(message: RtcClientMessage): void {
    if (this.closed) return;
    this.options.signal(message);
  }

  private teardown(link: Link): void {
    if (link.retry !== null) window.clearTimeout(link.retry);
    if (link.watchdog !== null) window.clearTimeout(link.watchdog);
    link.retry = null;
    link.watchdog = null;

    for (const channel of [link.audio, link.video]) {
      if (!channel) continue;
      channel.onmessage = null;
      channel.onopen = null;
      channel.onclose = null;
      try {
        channel.close();
      } catch {
        // Ya estaba cerrado.
      }
    }

    link.pc.onnegotiationneeded = null;
    link.pc.onicecandidate = null;
    link.pc.ondatachannel = null;
    link.pc.onconnectionstatechange = null;
    try {
      link.pc.close();
    } catch {
      // Ya estaba cerrado.
    }
  }
}

/** El candidato ICE tal cual viaja por JSON. */
function toWire(candidate: RTCIceCandidate): IceCandidateWire {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment ?? null,
  };
}

