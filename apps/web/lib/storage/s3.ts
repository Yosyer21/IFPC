import { sha256Hex, signRequest } from './sigv4';
import type { StorageDriver } from './types';

/** Configuración de un bucket compatible con S3 (AWS, MinIO, R2…). */
export interface S3Settings {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Base de las URLs públicas (CDN o el propio endpoint + bucket). */
  publicBaseUrl: string;
  /**
   * `path-style` (`endpoint/bucket/key`, lo que usa MinIO) frente a
   * `virtual-hosted` (`bucket.endpoint/key`, lo de AWS).
   */
  forcePathStyle: boolean;
}

const trimSlash = (value: string): string => value.replace(/\/+$/, '');

/** Lee la configuración de S3 del entorno; `null` si falta algo imprescindible. */
export function s3SettingsFromEnv(env: NodeJS.ProcessEnv = process.env): S3Settings | null {
  const endpoint = env.S3_ENDPOINT;
  const bucket = env.S3_BUCKET;
  const accessKeyId = env.S3_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  const forcePathStyle = env.S3_FORCE_PATH_STYLE !== 'false';

  return {
    endpoint: trimSlash(endpoint),
    region: env.S3_REGION ?? 'us-east-1',
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: trimSlash(
      env.S3_PUBLIC_BASE_URL ??
        (forcePathStyle ? `${trimSlash(endpoint)}/${bucket}` : `${bucket}.${trimSlash(endpoint)}`)
    ),
    forcePathStyle,
  };
}

/**
 * Driver S3 con **SigV4** hecho a mano (`node:crypto`), sin SDK: solo se usan
 * `PUT` y `DELETE`, así que arrastrar la dependencia de AWS no compensa.
 *
 * Se elige con `STORAGE_DRIVER=s3` + `S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID/
 * S3_SECRET_ACCESS_KEY`; `fetchImpl` se inyecta en los tests.
 */
export function s3Driver(
  settings: S3Settings,
  fetchImpl: typeof fetch = fetch,
  now: () => Date = () => new Date()
): StorageDriver {
  const objectUrl = (key: string): string => {
    const encoded = key.split('/').map(encodeURIComponent).join('/');
    return settings.forcePathStyle
      ? `${settings.endpoint}/${settings.bucket}/${encoded}`
      : `${settings.endpoint.replace('://', `://${settings.bucket}.`)}/${encoded}`;
  };

  const request = async (
    method: 'PUT' | 'DELETE',
    key: string,
    body: Buffer,
    contentType?: string
  ): Promise<Response> => {
    const url = objectUrl(key);
    const payloadHash = sha256Hex(body);
    const headers: Record<string, string> = { 'content-type': contentType ?? 'application/octet-stream' };
    const signed = signRequest(
      { method, url, headers, payloadHash },
      {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
        region: settings.region,
        service: 's3',
        now: now(),
      }
    );

    return fetchImpl(url, {
      method,
      headers: { ...headers, ...signed },
      ...(method === 'PUT' ? { body: body as unknown as BodyInit } : {}),
    });
  };

  return {
    kind: 's3',
    async save({ key, body, contentType }) {
      const response = await request('PUT', key, body, contentType);
      if (!response.ok) {
        throw new Error(`S3 respondió ${response.status} al subir ${key}`);
      }
      const encoded = key.split('/').map(encodeURIComponent).join('/');
      return { url: `${settings.publicBaseUrl}/${encoded}` };
    },
    async remove(url) {
      if (!url?.startsWith(settings.publicBaseUrl)) return;
      const key = url.slice(settings.publicBaseUrl.length + 1);
      try {
        await request('DELETE', decodeURIComponent(key), Buffer.alloc(0));
      } catch {
        // Borrado best-effort: no debe romper la acción que lo pidió.
      }
    },
  };
}
