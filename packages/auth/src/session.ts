import type { Role } from './roles';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

/**
 * Indica si la petición ha llegado por HTTPS.
 *
 * Detrás de un proxy (Railway, Vercel…) el protocolo real viaja en la cabecera
 * `x-forwarded-proto`; `fallbackProtocol` es el de `request.nextUrl` (p. ej.
 * `'https:'`).
 *
 * Es necesario para leer la sesión de Auth.js: en HTTPS la cookie se llama
 * `__Secure-authjs.session-token` y, además, Auth.js usa **el nombre de la
 * cookie como `salt`** al cifrar el JWT. `getToken` asume por defecto una cookie
 * NO segura, así que sin este dato el token no se puede descifrar (funcionaba en
 * local por http y fallaba en producción por HTTPS).
 */
export function isSecureRequest(
  headers: Pick<Headers, 'get'>,
  fallbackProtocol?: string | null
): boolean {
  const forwarded = headers.get('x-forwarded-proto');
  const raw = forwarded ?? fallbackProtocol ?? '';
  // En una cadena de proxies el primer valor es el protocolo original.
  const protocol = (raw.split(',')[0] ?? '').trim().toLowerCase();
  return protocol.startsWith('https');
}

