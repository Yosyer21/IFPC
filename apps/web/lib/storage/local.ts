import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StorageDriver } from './types';

/** Prefijo público de los archivos locales (los sirve Next desde `public/`). */
export const LOCAL_UPLOADS_PREFIX = '/uploads/';

/**
 * Driver de disco: guarda en `public/uploads/<key>` (o `UPLOAD_DIR`) y devuelve
 * la URL estática de siempre. Es el driver por defecto.
 */
export function localDriver(env: NodeJS.ProcessEnv = process.env): StorageDriver {
  const root = env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads');

  return {
    kind: 'local',
    async save({ key, body }) {
      const target = path.join(root, key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
      return { url: `${LOCAL_UPLOADS_PREFIX}${key}` };
    },
    async remove(url) {
      if (!url?.startsWith(LOCAL_UPLOADS_PREFIX)) return;
      try {
        await unlink(path.join(root, url.slice(LOCAL_UPLOADS_PREFIX.length)));
      } catch {
        // El archivo ya no está: nada que limpiar.
      }
    },
  };
}
