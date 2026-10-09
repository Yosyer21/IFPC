import { createHash, createHmac } from 'node:crypto';

/**
 * Firma **AWS Signature Version 4** con `node:crypto`, sin SDK. Es puro (no
 * toca red ni entorno) para poder testearlo y validarlo con `openssl`.
 *
 * Referencia: «Signature Calculations for the Authorization Header: Transferring
 * Payload in a Single Chunk» (AWS General Reference).
 */

/** Petición a firmar. Las cabeceras deben venir tal cual se van a enviar. */
export interface SignableRequest {
  method: string;
  /** URL completa; el `host` sale de aquí. */
  url: string;
  headers: Record<string, string>;
  /** SHA-256 en hex del cuerpo (`sha256Hex('')` si no hay cuerpo). */
  payloadHash: string;
}

export interface SigningCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
  /** Momento de la firma (la ventana de validez es de 15 minutos en AWS). */
  now: Date;
}

/** SHA-256 en hexadecimal. */
export const sha256Hex = (data: string | Buffer): string =>
  createHash('sha256').update(data).digest('hex');

const hmac = (key: string | Buffer, data: string): Buffer =>
  createHmac('sha256', key).update(data, 'utf8').digest();

/** `YYYYMMDD'T'HHMMSS'Z'`. */
export function amzDate(now: Date): string {
  return `${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
}

/** Clave de firma derivada: `AWS4` + secreto, fecha, región y servicio. */
export function signingKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

/** URI canónico: cada segmento codificado (RFC 3986), las barras se conservan. */
export function canonicalUri(pathname: string): string {
  const path = pathname.length === 0 ? '/' : pathname;
  return path
    .split('/')
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/g,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
      )
    )
    .join('/');
}

/** Query canónica: parámetros ordenados por clave codificada y valor codificado. */
export function canonicalQuery(search: string): string {
  if (!search) return '';
  const params: [string, string][] = [...new URLSearchParams(search).entries()].map(
    ([key, value]) => [encodeURIComponent(key), encodeURIComponent(value)]
  );
  params.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
  return params.map(([key, value]) => `${key}=${value}`).join('&');
}

const normalizeValue = (value: string): string => value.trim().replace(/\s+/g, ' ');

/** Piezas intermedias de la firma (útiles para depurar y para validar). */
export interface SigningPieces {
  /** `YYYYMMDD'T'HHMMSS'Z'`. */
  amzDate: string;
  /** Cabeceras firmadas, en orden alfabético y separadas por `;`. */
  signedHeaders: string;
  canonicalRequest: string;
  stringToSign: string;
  scope: string;
  signature: string;
}

/**
 * Calcula las piezas de la firma sin tocar la red. `headers` no debe traer ya
 * `authorization`, `host`, `x-amz-date` ni `x-amz-content-sha256`.
 */
export function signingPieces(
  request: SignableRequest,
  credentials: SigningCredentials
): SigningPieces {
  const url = new URL(request.url);
  const date = amzDate(credentials.now);
  const dateStamp = date.slice(0, 8);

  const headers: Record<string, string> = { host: url.host };
  for (const [name, value] of Object.entries(request.headers)) {
    headers[name.toLowerCase()] = value;
  }
  headers['x-amz-content-sha256'] = request.payloadHash;
  headers['x-amz-date'] = date;

  const names = Object.keys(headers).sort();
  const canonicalHeaders = names
    .map((name) => `${name}:${normalizeValue(headers[name] ?? '')}\n`)
    .join('');
  const signedHeaders = names.join(';');

  const canonicalRequest = [
    request.method.toUpperCase(),
    canonicalUri(url.pathname),
    canonicalQuery(url.search),
    canonicalHeaders,
    signedHeaders,
    request.payloadHash,
  ].join('\n');

  const scope = `${dateStamp}/${credentials.region}/${credentials.service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', date, scope, sha256Hex(canonicalRequest)].join('\n');
  const signature = hmac(
    signingKey(credentials.secretAccessKey, dateStamp, credentials.region, credentials.service),
    stringToSign
  ).toString('hex');

  return { amzDate: date, signedHeaders, canonicalRequest, stringToSign, scope, signature };
}

/**
 * Devuelve las cabeceras que hay que enviar: `x-amz-date`,
 * `x-amz-content-sha256` y `authorization`.
 */
export function signRequest(
  request: SignableRequest,
  credentials: SigningCredentials
): Record<string, string> {
  const pieces = signingPieces(request, credentials);

  return {
    'x-amz-date': pieces.amzDate,
    'x-amz-content-sha256': request.payloadHash,
    authorization:
      `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${pieces.scope}, ` +
      `SignedHeaders=${pieces.signedHeaders}, Signature=${pieces.signature}`,
  };
}
