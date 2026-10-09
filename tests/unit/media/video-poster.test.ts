import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { extractVideoPoster, hasFfmpeg } from '@/lib/media/video-poster';

const run = promisify(execFile);
const ffmpeg = await hasFfmpeg();

/** Vídeo de prueba de dos segundos generado con ffmpeg. */
async function sampleVideo(): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), 'ifpc-sample-'));
  const target = path.join(dir, 'sample.mp4');
  await run('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc=duration=2:size=320x240:rate=10',
    '-pix_fmt',
    'yuv420p',
    target,
  ]);
  return readFile(target);
}

describe.skipIf(!ffmpeg)('extractVideoPoster (con ffmpeg)', () => {
  it('devuelve un JPEG con el fotograma del vídeo', async () => {
    const poster = await extractVideoPoster(await sampleVideo(), 'mp4');

    expect(poster).not.toBeNull();
    // Firma de un JPEG: SOI + marcador APP0.
    expect(poster?.subarray(0, 3).toString('hex')).toBe('ffd8ff');
    // Cabecera JFIF dentro de los primeros bytes.
    expect(poster?.subarray(0, 10).toString('latin1')).toContain('JFIF');
  });

  it('respeta el ancho pedido', async () => {
    const poster = await extractVideoPoster(await sampleVideo(), 'mp4', { width: 120 });
    expect(poster).not.toBeNull();
  });
});

describe('extractVideoPoster (sin ffmpeg o con datos inválidos)', () => {
  it('devuelve null si el archivo no es un vídeo', async () => {
    const poster = await extractVideoPoster(Buffer.from('no soy un vídeo'), 'mp4', {
      timeoutMs: 10_000,
    });
    expect(poster).toBeNull();
  });

  it('devuelve null si ffmpeg no está disponible', async () => {
    const original = process.env.PATH;
    process.env.PATH = '';
    try {
      expect(await extractVideoPoster(Buffer.from('x'), 'mp4')).toBeNull();
      expect(await hasFfmpeg()).toBe(false);
    } finally {
      process.env.PATH = original;
    }
  });
});
