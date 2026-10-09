import { createHash, createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { localDriver } from '@/lib/storage/local';
import { s3Driver, s3SettingsFromEnv } from '@/lib/storage/s3';
import {
  amzDate,
  canonicalQuery,
  canonicalUri,
  sha256Hex,
  signRequest,
  signingKey,
  signingPieces,
} from '@/lib/storage/sigv4';

const CREDENTIALS = {
  accessKeyId: 'AKIDEXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
  region: 'us-east-1',
  service: 's3',
  now: new Date('2026-08-10T09:00:00.000Z'),
};

describe('sha256Hex y amzDate', () => {
  it('el hash del cuerpo vacío es el conocido de SHA-256', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('el hash del texto «abc» es el conocido de SHA-256', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('formatea la fecha en el formato de AWS', () => {
    expect(amzDate(CREDENTIALS.now)).toBe('20260810T090000Z');
  });
});

describe('canonicalUri y canonicalQuery', () => {
  it('codifica cada segmento sin tocar las barras', () => {
    expect(canonicalUri('/bucket/posts/foto de verano.jpg')).toBe(
      '/bucket/posts/foto%20de%20verano.jpg'
    );
    expect(canonicalUri('/bucket/a(b)/c*')).toBe('/bucket/a%28b%29/c%2A');
    expect(canonicalUri('')).toBe('/');
  });

  it('ordena los parámetros por clave y valor', () => {
    expect(canonicalQuery('?b=2&a=1&a=0')).toBe('a=0&a=1&b=2');
    expect(canonicalQuery('')).toBe('');
  });
});

describe('signRequest', () => {
  const request = {
    method: 'PUT',
    url: 'https://s3.example.com/ifpc/posts/foto.png',
    headers: { 'content-type': 'image/png' },
    payloadHash: sha256Hex('contenido'),
  };

  it('devuelve las tres cabeceras de firma', () => {
    const signed = signRequest(request, CREDENTIALS);

    expect(Object.keys(signed).sort()).toEqual([
      'authorization',
      'x-amz-content-sha256',
      'x-amz-date',
    ]);
    expect(signed['x-amz-date']).toBe('20260810T090000Z');
    expect(signed['x-amz-content-sha256']).toBe(request.payloadHash);
  });

  it('la credencial lleva fecha, región, servicio y aws4_request', () => {
    const signed = signRequest(request, CREDENTIALS);
    const authorization = signed.authorization ?? '';

    expect(authorization).toContain(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20260810/us-east-1/s3/aws4_request'
    );
    expect(authorization).toContain('SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date');
    expect(authorization).toMatch(/Signature=[0-9a-f]{64}$/);
  });

  it('es determinista y cambia con el cuerpo o la hora', () => {
    const base = signRequest(request, CREDENTIALS).authorization;
    expect(signRequest(request, CREDENTIALS).authorization).toBe(base);

    const otherBody = signRequest({ ...request, payloadHash: sha256Hex('otro') }, CREDENTIALS);
    expect(otherBody.authorization).not.toBe(base);

    const later = signRequest(request, {
      ...CREDENTIALS,
      now: new Date('2026-08-10T10:00:00.000Z'),
    });
    expect(later.authorization).not.toBe(base);
  });

  it('la clave de firma es estable para los mismos datos', () => {
    const key = signingKey(CREDENTIALS.secretAccessKey, '20260810', 'us-east-1', 's3');

    expect(key).toEqual(signingKey(CREDENTIALS.secretAccessKey, '20260810', 'us-east-1', 's3'));
    expect(key).not.toEqual(signingKey(CREDENTIALS.secretAccessKey, '20260811', 'us-east-1', 's3'));
  });
});

describe('signingPieces', () => {
  const request = {
    method: 'put',
    url: 'https://s3.example.com/ifpc/posts/foto.png',
    headers: { 'content-type': 'image/png' },
    payloadHash: sha256Hex('contenido'),
  };

  it('sigue el formato canónico de AWS', () => {
    const lines = signingPieces(request, CREDENTIALS).canonicalRequest.split('\n');

    expect(lines[0]).toBe('PUT');
    expect(lines[1]).toBe('/ifpc/posts/foto.png');
    expect(lines[2]).toBe('');
    expect(lines.slice(3, 7)).toEqual([
      'content-type:image/png',
      'host:s3.example.com',
      `x-amz-content-sha256:${request.payloadHash}`,
      'x-amz-date=20260810T090000Z'.replace('=', ':'),
    ]);
    // La spec añade un `\n` extra tras el bloque de cabeceras: de ahí la línea vacía.
    expect(lines[7]).toBe('');
    expect(lines[8]).toBe('content-type;host;x-amz-content-sha256;x-amz-date');
    expect(lines[9]).toBe(request.payloadHash);
    expect(lines).toHaveLength(10);
  });

  it('el scope y el string-to-sign llevan la fecha, la región y el servicio', () => {
    const pieces = signingPieces(request, CREDENTIALS);

    expect(pieces.scope).toBe('20260810/us-east-1/s3/aws4_request');
    expect(pieces.stringToSign.split('\n')).toEqual([
      'AWS4-HMAC-SHA256',
      '20260810T090000Z',
      '20260810/us-east-1/s3/aws4_request',
      sha256Hex(pieces.canonicalRequest),
    ]);
  });
});
