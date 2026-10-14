import { describe, expect, it } from 'vitest';
import {
  MEDIA_KIND,
  ROOM_MAX_PARTICIPANTS,
  decodeClientFrame,
  decodeServerFrame,
  encodeClientFrame,
  encodeServerFrame,
  freeSlot,
  isPolitePeer,
  pairKey,
  readPeerSignal,
} from './index';

describe('frames de medios', () => {
  const payload = new Uint8Array([7, 8, 9]);

  it('ida y vuelta del frame del cliente', () => {
    const buffer = encodeClientFrame({ kind: MEDIA_KIND.audio, seq: 42, payload });
    expect(buffer[0]).toBe(MEDIA_KIND.audio);

    const frame = decodeClientFrame(buffer);
    expect(frame).not.toBeNull();
    expect(frame?.kind).toBe(MEDIA_KIND.audio);
    expect(frame?.seq).toBe(42);
    expect([...(frame?.payload ?? [])]).toEqual([7, 8, 9]);
  });

  it('ida y vuelta del frame del servicio, con el índice del emisor', () => {
    const buffer = encodeServerFrame({ kind: MEDIA_KIND.video, index: 3, seq: 7, payload });
    const frame = decodeServerFrame(buffer);

    expect(frame?.kind).toBe(MEDIA_KIND.video);
    expect(frame?.index).toBe(3);
    expect(frame?.seq).toBe(7);
    expect([...(frame?.payload ?? [])]).toEqual([7, 8, 9]);
  });

  it('rechaza cabeceras vacías, cortas o con tipo desconocido', () => {
    expect(decodeClientFrame(new Uint8Array([]))).toBeNull();
    expect(decodeClientFrame(new Uint8Array([MEDIA_KIND.audio, 0, 0, 0, 0]))).toBeNull();
    expect(decodeClientFrame(new Uint8Array([9, 0, 0, 0, 0, 1]))).toBeNull();
    expect(decodeServerFrame(new Uint8Array([9, 0, 0, 0, 0, 0, 1]))).toBeNull();
  });
});

describe('slots del roster', () => {
  it('da el índice libre más bajo y respeta el cupo', () => {
    expect(freeSlot([])).toBe(0);
    expect(freeSlot([0, 1])).toBe(2);
    expect(freeSlot([0, 2])).toBe(1);
    expect(freeSlot([0, 1, 2, 3])).toBeNull();
    expect(ROOM_MAX_PARTICIPANTS).toBe(4);
  });
});

describe('vía directa (WebRTC)', () => {
  it('identifica un par igual sin importar el orden', () => {
    expect(pairKey('ana', 'luis')).toBe('ana|luis');
    expect(pairKey('luis', 'ana')).toBe('ana|luis');
    expect(pairKey('luis', 'ana')).toBe(pairKey('ana', 'luis'));
  });

  it('el id menor manda y cada lado ve lo contrario en un choque de ofertas', () => {
    expect(isPolitePeer('ana', 'luis')).toBe(true);
    expect(isPolitePeer('luis', 'ana')).toBe(false);
    // Nunca los dos ceden ni los dos empujan: el acuerdo es el mismo en ambos.
    expect(isPolitePeer('ana', 'luis')).toBe(!isPolitePeer('luis', 'ana'));
  });

  it('valida la señalización que entra por el socket', () => {
    expect(readPeerSignal({ t: 'p2p-offer', to: 'luis', sdp: 'v=0' })).toEqual({
      t: 'p2p-offer',
      to: 'luis',
      sdp: 'v=0',
    });
    expect(
      readPeerSignal({
        t: 'p2p-ice',
        to: 'luis',
        candidate: { candidate: 'candidate:1', sdpMid: null, sdpMLineIndex: 2 },
      })
    ).toEqual({
      t: 'p2p-ice',
      to: 'luis',
      candidate: { candidate: 'candidate:1', sdpMid: null, sdpMLineIndex: 2, usernameFragment: null },
    });

    // Fin de candidatos y campos que sobran.
    expect(readPeerSignal({ t: 'p2p-ice', to: 'luis' })).toEqual({
      t: 'p2p-ice',
      to: 'luis',
      candidate: null,
    });
    expect(readPeerSignal({ t: 'p2p-direct', userId: 'luis', direct: true })).toBeNull();
    expect(readPeerSignal({ t: 'p2p-offer', to: '', sdp: 'v=0' })).toBeNull();
    expect(readPeerSignal({ t: 'p2p-offer', to: 'luis', sdp: '' })).toBeNull();
    expect(readPeerSignal({ t: 'p2p-offer', to: 'luis', sdp: 'x'.repeat(20_000) })).toBeNull();
    expect(readPeerSignal({ t: 'p2p-ice', to: 'luis', candidate: 'candidate:1' })).toBeNull();
    expect(readPeerSignal(null)).toBeNull();
    expect(readPeerSignal('hola')).toBeNull();
  });
});
