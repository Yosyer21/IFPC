import { localDriver } from './local';
import { s3Driver, s3SettingsFromEnv } from './s3';
import type { StorageDriver } from './types';

export type { StorageDriver } from './types';
export { LOCAL_UPLOADS_PREFIX } from './local';
export { s3SettingsFromEnv, type S3Settings } from './s3';
export { sha256Hex, signRequest, signingKey, canonicalUri, canonicalQuery, amzDate } from './sigv4';

/**
 * Driver de almacenamiento activo. Por defecto el **disco** (`public/uploads`,
 * como siempre); con `STORAGE_DRIVER=s3` y la configuración completa se sube al
 * bucket firmando cada petición con SigV4.
 *
 * Si se pide S3 pero falta configuración se cae al disco con un aviso: perder la
 * subida es peor que guardarla donde siempre.
 */
export function resolveStorage(env: NodeJS.ProcessEnv = process.env): StorageDriver {
  if (env.STORAGE_DRIVER === 's3') {
    const settings = s3SettingsFromEnv(env);
    if (settings) return s3Driver(settings);
    console.warn(
      '[storage] STORAGE_DRIVER=s3 sin S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY: se usa el disco.'
    );
  }
  return localDriver(env);
}
