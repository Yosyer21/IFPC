import { createHash, createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { localDriver } from '@/lib/storage/local';
import { s3Driver } from '@/lib/storage/s3';

/**
 * Verificador SigV4 escrito **aparte** del firmador (a propósito): reconstruye la
 * petición canónica desde cero para contrastar la firma que envía el cliente.
 */
function expectedSignature(
  request: { method: string; url: string; headers: Record<string, string>; payloadHash: string },
  signed: Record<string, string>,
  credentials: { secretAccessKey: string; region: string }
): string {
  const url = new URL(request.url);
  const all: Record<string, string> = { host: url.host };
  for (const [name, value] of Object.entries(request.headers)) all[name.toLowerCase()] = value;
  all['x-amz-content-sha256'] = request.payloadHash;
  all['x-amz-date'] = signed['x-amz-date'] ?? '';

  const names = Object.keys(all).sort();
  const canonicalHeaders = names
    .map((name) => `${name}:${(all[name] ?? '').trim().replace(/\s+/g, ' ')}\n`)
    .join('');
  const canonicalRequest = [
    request.method,
    url.pathname.split('/').map(encodeURIComponent).join('/'),
    '',
    canonicalHeaders,
    names.join(';'),
    request.payloadHash,
  ].join('\n');

  const dateStamp = (signed['x-amz-date'] ?? '').slice(0, 8);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    signed['x-amz-date'],
    `${dateStamp}/${credentials.region}/s3/aws4_request`,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  let key: string | Buffer = `AWS4${credentials.secretAccessKey}`;
  for (const part of [dateStamp, credentials.region, 's3', 'aws4_request']) {
    key = createHmac('sha256', key).update(part).digest();
  }
  return createHmac('sha256', key).update(stringToSign).digest('hex');
}

describe('localDriver', () => {
  it('guarda en disco y devuelve la URL estática', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ifpc-uploads-'));
    const driver = localDriver({ UPLOAD_DIR: root });

    const { url } = await driver.save({
      key: 'posts/foto.png',
      body: Buffer.from('bytes'),
      contentType: 'image/png',
    });

    expect(url).toBe('/uploads/posts/foto.png');
    expect(await readFile(path.join(root, 'posts/foto.png'), 'utf8')).toBe('bytes');
  });

  it('borra el archivo propio e ignora las URLs externas', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ifpc-uploads-'));
    const driver = localDriver({ UPLOAD_DIR: root });
    await writeFile(path.join(root, 'suelto.png'), 'x');

    await driver.remove('/uploads/suelto.png');
    await expect(readFile(path.join(root, 'suelto.png'), 'utf8')).rejects.toThrow();

    // Un vídeo de YouTube no es un archivo nuestro: no debe intentar borrarlo.
    await expect(driver.remove('https://youtu.be/abc')).resolves.toBeUndefined();
    await expect(driver.remove(null)).resolves.toBeUndefined();
  });
});

describe('s3Driver contra un S3 local', () => {
  const received: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Buffer;
  }[] = [];
  let server: ReturnType<typeof createServer>;
  let endpoint = '';

  beforeAll(async () => {
    server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        const headers: Record<string, string> = {};
        for (const [name, value] of Object.entries(request.headers)) {
          headers[name] = Array.isArray(value) ? value.join(', ') : (value ?? '');
        }
        received.push({
          method: request.method ?? '',
          url: request.url ?? '',
          headers,
          body: Buffer.concat(chunks),
        });

        if ((request.url ?? '').includes('rechazado')) {
          response.writeHead(403).end('AccessDenied');
          return;
        }
        response.writeHead(request.method === 'PUT' ? 200 : 204).end();
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    endpoint = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const settings = () => ({
    endpoint,
    region: 'us-east-1',
    bucket: 'ifpc',
    accessKeyId: 'AKIDEXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
    publicBaseUrl: `${endpoint}/ifpc`,
    forcePathStyle: true,
  });

  it('sube con PUT firmado y devuelve la URL pública', async () => {
    const driver = s3Driver(settings());
    const body = Buffer.from('contenido del vídeo');

    const { url } = await driver.save({ key: 'posts/video.mp4', body, contentType: 'video/mp4' });

    expect(url).toBe(`${endpoint}/ifpc/posts/video.mp4`);
    const request = received.at(-1);
    expect(request?.method).toBe('PUT');
    expect(request?.url).toBe('/ifpc/posts/video.mp4');
    expect(request?.headers['content-type']).toBe('video/mp4');
    expect(request?.body.toString()).toBe('contenido del vídeo');
  });

  it('la firma coincide con un verificador independiente', () => {
    const request = received.at(-1);
    const signature =
      (request?.headers.authorization ?? '').match(/Signature=([0-9a-f]{64})$/)?.[1] ?? '';

    expect(signature).toHaveLength(64);
    expect(signature).toBe(
      expectedSignature(
        {
          method: 'PUT',
          url: `${endpoint}${request?.url ?? ''}`,
          headers: { 'content-type': request?.headers['content-type'] ?? '' },
          payloadHash: request?.headers['x-amz-content-sha256'] ?? '',
        },
        { 'x-amz-date': request?.headers['x-amz-date'] ?? '' },
        { secretAccessKey: settings().secretAccessKey, region: 'us-east-1' }
      )
    );
  });

  it('borra con DELETE solo las URLs del bucket', async () => {
    const driver = s3Driver(settings());
    const before = received.length;

    await driver.remove(`${endpoint}/ifpc/posts/video.mp4`);
    expect(received.at(-1)?.method).toBe('DELETE');
    expect(received.at(-1)?.url).toBe('/ifpc/posts/video.mp4');

    await driver.remove('https://youtu.be/abc');
    await driver.remove('/uploads/posts/local.png');
    expect(received.length).toBe(before + 1);
  });

  it('lanza si el bucket responde con error', async () => {
    const driver = s3Driver(settings());

    await expect(
      driver.save({ key: 'posts/rechazado.png', body: Buffer.from('x'), contentType: 'image/png' })
    ).rejects.toThrow('403');
  });
});
