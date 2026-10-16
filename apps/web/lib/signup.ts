import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Prisma } from '@ifpc/database';
import type { SignupRole } from '@ifpc/config';

/**
 * Datos que recoge el asistente de alta (slides), según el tipo de cuenta.
 * Todos opcionales: el alta por email crea el perfil con lo mínimo.
 */
export type SignupProfileDetails = {
  /** Jugador. */
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  position?: string | null;
  foot?: string | null;
  /** Entrenador. */
  clubName?: string | null;
  /** Club. */
  name?: string | null;
  city?: string | null;
  league?: string | null;
};

/**
 * Crea el perfil que corresponde al tipo de cuenta. Se hace **dentro** de la
 * transacción del alta (email o Google) para que nunca quede un usuario sin su
 * perfil, y la comparten `registerAction` y `completeSignupAction`.
 */
export async function createRoleProfile(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    role: SignupRole;
    name: string;
    email: string;
    country: string;
    details?: SignupProfileDetails;
  }
): Promise<void> {
  const { userId, role, name, email, country, details = {} } = input;

  switch (role) {
    case 'PLAYER':
      await tx.player.create({
        data: {
          userId,
          firstName: details.firstName?.trim() || name,
          lastName: details.lastName?.trim() || '',
          dateOfBirth: details.dateOfBirth ? new Date(details.dateOfBirth) : null,
          nationality: details.nationality?.trim() || null,
          position: details.position?.trim() || null,
          foot: details.foot?.trim() || null,
        },
      });
      break;
    case 'COACH':
      await tx.coach.create({
        data: { userId, clubName: details.clubName?.trim() || null },
      });
      break;
    case 'CLUB':
      await tx.club.create({
        data: {
          userId,
          email,
          name: details.name?.trim() || name,
          country,
          city: details.city?.trim() || null,
          league: details.league?.trim() || null,
        },
      });
      break;
    default:
      break;
  }
}

/** Tipos MIME de foto que aceptamos guardar, con su extensión. */
const AVATAR_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * Se trae a disco la foto que devuelve un proveedor externo (Google) para poder
 * servirla como el resto de fotos locales (`PlayerAvatar` solo pinta rutas
 * internas). Es **best-effort**: si algo falla, la persona se queda con sus
 * iniciales y puede subir una foto desde Ajustes.
 */
export async function downloadRemoteAvatar(url: string | null | undefined): Promise<string | null> {
  if (!url?.startsWith('https://')) return null;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const mime = (response.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
    const ext = AVATAR_MIME_EXT[mime];
    if (!ext) return null;

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_AVATAR_BYTES) return null;

    const dir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    await mkdir(dir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(dir, filename), bytes);

    return `/uploads/photos/${filename}`;
  } catch {
    return null;
  }
}
