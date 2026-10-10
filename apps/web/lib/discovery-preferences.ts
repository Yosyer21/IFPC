import { prisma } from '@ifpc/database';
import { FEED_PREFERENCE_WEIGHTS, type AuthorPreferenceKind } from '@ifpc/config';

/**
 * Sistema de preferencias del feed. Seguir a alguien **ya es** una preferencia
 * (impulso implícito), y encima el espectador puede afinarla autor por autor con
 * «ver más» / «ver menos».
 *
 * Alcance: solo cambia el orden de los listados **rankeados** («Para ti» y
 * «Tendencias»). Los cronológicos («Recientes» y «Siguiendo») se quedan como
 * están —y sí muestran a los autores con «ver menos»— para que la preferencia no
 * se convierta en una censura invisible.
 */

// ---------------------------------------------------------------------------
// Funciones puras
// ---------------------------------------------------------------------------

/** ¿Es una preferencia válida? (los valores vienen de la base como texto). */
export function isPreferenceKind(value: unknown): value is AuthorPreferenceKind {
  return value === 'MORE' || value === 'LESS';
}

/** Peso del autor en el ranking según seguimiento y preferencia explícita. */
export function preferenceWeight(input: {
  isFollowed: boolean;
  preference: AuthorPreferenceKind | null;
}): number {
  if (input.preference === 'LESS') return FEED_PREFERENCE_WEIGHTS.less;

  let weight = input.isFollowed ? FEED_PREFERENCE_WEIGHTS.followed : 0;
  if (input.preference === 'MORE') weight += FEED_PREFERENCE_WEIGHTS.more;
  return weight;
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/** Preferencias del espectador por autor (`MORE`/`LESS`), indexadas. */
export async function authorPreferences(
  viewerId?: string | null
): Promise<Map<string, AuthorPreferenceKind>> {
  if (!viewerId) return new Map();

  const rows = await prisma.authorPreference.findMany({
    where: { userId: viewerId },
    select: { authorId: true, kind: true },
  });

  return new Map(
    rows.flatMap((row) => (isPreferenceKind(row.kind) ? [[row.authorId, row.kind] as const] : []))
  );
}

/** Ids de los autores que el espectador sigue. */
export async function followedAuthorIds(viewerId?: string | null): Promise<Set<string>> {
  if (!viewerId) return new Set();

  const rows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  return new Set(rows.map((row) => row.followingId));
}

/**
 * Autores con «ver menos»: quedan fuera de «Para ti» y «Tendencias» (en los
 * listados cronológicos siguen apareciendo, solo caen en el ranking).
 */
export async function downrankedAuthorIds(viewerId?: string | null): Promise<string[]> {
  const preferences = await authorPreferences(viewerId);
  return [...preferences].filter(([, kind]) => kind === 'LESS').map(([authorId]) => authorId);
}

/**
 * Seguimiento + preferencia del espectador en una sola consulta, que es lo que
 * necesita el ranking: a quién sigue, a quién quiere ver más y a quién menos.
 */
export async function feedPreferenceContext(viewerId?: string | null): Promise<{
  followed: Set<string>;
  preferences: Map<string, AuthorPreferenceKind>;
  /** `preferenceWeight` ya atado al espectador. */
  weightOf: (authorId: string) => number;
}> {
  const [followed, preferences] = await Promise.all([
    followedAuthorIds(viewerId),
    authorPreferences(viewerId),
  ]);

  return {
    followed,
    preferences,
    weightOf: (authorId) =>
      preferenceWeight({
        isFollowed: followed.has(authorId),
        preference: preferences.get(authorId) ?? null,
      }),
  };
}

/** Guarda, cambia o quita la preferencia del espectador sobre un autor. */
export async function setAuthorPreference(input: {
  userId: string;
  authorId: string;
  /** `null` borra la preferencia (el autor vuelve al comportamiento normal). */
  kind: AuthorPreferenceKind | null;
}): Promise<void> {
  // Sobre uno mismo no tiene sentido.
  if (input.userId === input.authorId) return;

  if (input.kind === null) {
    await prisma.authorPreference.deleteMany({
      where: { userId: input.userId, authorId: input.authorId },
    });
    return;
  }

  await prisma.authorPreference.upsert({
    where: { userId_authorId: { userId: input.userId, authorId: input.authorId } },
    create: { userId: input.userId, authorId: input.authorId, kind: input.kind },
    update: { kind: input.kind },
  });
}

/** Preferencia del espectador sobre un autor concreto (o `null`). */
export async function getAuthorPreference(input: {
  userId: string;
  authorId: string;
}): Promise<AuthorPreferenceKind | null> {
  if (input.userId === input.authorId) return null;

  const row = await prisma.authorPreference.findUnique({
    where: { userId_authorId: { userId: input.userId, authorId: input.authorId } },
    select: { kind: true },
  });
  return row && isPreferenceKind(row.kind) ? row.kind : null;
}

/** Una preferencia con los datos del autor, para la página de gestión. */
export interface AuthorPreferenceEntry {
  id: string;
  name: string;
  role: string;
  image: string | null;
  kind: AuthorPreferenceKind;
}

/** Preferencias del espectador con el perfil de cada autor. */
export async function listAuthorPreferences(viewerId: string): Promise<AuthorPreferenceEntry[]> {
  const rows = await prisma.authorPreference.findMany({
    where: { userId: viewerId },
    orderBy: { updatedAt: 'desc' },
    select: {
      kind: true,
      author: { select: { id: true, name: true, role: true, image: true } },
    },
  });

  return rows.flatMap((row) =>
    isPreferenceKind(row.kind)
      ? [
          {
            id: row.author.id,
            name: row.author.name,
            role: row.author.role,
            image: row.author.image,
            kind: row.kind,
          },
        ]
      : []
  );
}
