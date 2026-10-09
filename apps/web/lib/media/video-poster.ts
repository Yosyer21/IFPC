import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * Extrae el **fotograma de portada** de un vídeo con `ffmpeg` y lo devuelve como
 * JPEG (o `null` si no se pudo: ffmpeg no está, el vídeo no se puede leer…).
 *
 * Nunca lanza: la miniatura es un extra, la publicación sale igual sin ella.
 */
export async function extractVideoPoster(
  video: Buffer,
  extension: string,
  options: { atSeconds?: number; width?: number; timeoutMs?: number } = {}
): Promise<Buffer | null> {
  const atSeconds = options.atSeconds ?? 1;
  const width = options.width ?? 640;
  const timeoutMs = options.timeoutMs ?? 15_000;

  let dir: string | null = null;
  try {
    dir = await mkdtemp(path.join(tmpdir(), 'ifpc-poster-'));
    const input = path.join(dir, `in.${extension}`);
    const output = path.join(dir, 'poster.jpg');
    await writeFile(input, video);

    await run(
      'ffmpeg',
      [
        '-y',
        '-ss',
        String(atSeconds),
        '-i',
        input,
        '-frames:v',
        '1',
        '-vf',
        `scale=${width}:-2`,
        output,
      ],
      { timeout: timeoutMs, windowsHide: true }
    );

    return await readFile(output);
  } catch {
    return null;
  } finally {
    if (dir) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

/** ¿Hay `ffmpeg` disponible en el sistema? */
export async function hasFfmpeg(): Promise<boolean> {
  try {
    await run('ffmpeg', ['-version'], { timeout: 5_000, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}
