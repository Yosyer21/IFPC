import { prisma } from '@ifpc/database';
import { FEED_BANNED_WORDS, FEED_RATE_LIMITS } from '@ifpc/config';

/**
 * Guardarraíles anti-abuso del feed: ritmo de publicación, duplicados, enlaces y
 * lenguaje prohibido. Sin dependencias externas (no hay Redis en desarrollo):
 * los contadores salen de la propia base de datos.
 */

// ---------------------------------------------------------------------------
// Funciones puras
// ---------------------------------------------------------------------------

/** ¿El texto incluye alguna palabra prohibida (por palabra completa)? */
export function containsBannedWord(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return FEED_BANNED_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'u').test(normalized));
}

/** Enlaces `http(s)://` de un texto. */
export function countLinks(text: string | null | undefined): number {
  return text?.match(/https?:\/\/\S+/gi)?.length ?? 0;
}

/** Motivo por el que un contenido no pasa los guardarraíles (o `null` si pasa). */
export type GuardrailReason = 'rate_limit' | 'duplicate' | 'too_many_links' | 'banned_words';

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/** ¿El usuario está dentro del ritmo permitido para ese tipo de contenido? */
export async function withinRateLimit(
  userId: string,
  kind: 'post' | 'comment'
): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const max =
    kind === 'post' ? FEED_RATE_LIMITS.postsPerHour : FEED_RATE_LIMITS.commentsPerHour;

  const count =
    kind === 'post'
      ? await prisma.post.count({ where: { authorId: userId, createdAt: { gte: since } } })
      : await prisma.postComment.count({
          where: { authorId: userId, createdAt: { gte: since } },
        });

  return count < max;
}

/** ¿Es un duplicado reciente del mismo autor? */
export async function isDuplicatePost(userId: string, body: string | null): Promise<boolean> {
  if (!body) return false;

  const since = new Date(Date.now() - FEED_RATE_LIMITS.duplicateWindowMinutes * 60 * 1000);
  const existing = await prisma.post.findFirst({
    where: { authorId: userId, body, createdAt: { gte: since } },
    select: { id: true },
  });
  return existing !== null;
}

/**
 * Revisiones de una publicación nueva. Devuelve el primer motivo encontrado.
 * El lenguaje prohibido **no** bloquea: marca la publicación para revisión.
 */
export async function reviewPost(input: {
  userId: string;
  title: string | null;
  body: string | null;
}): Promise<{ reason: GuardrailReason } | { hidden: true } | null> {
  if (!(await withinRateLimit(input.userId, 'post'))) {
    return { reason: 'rate_limit' };
  }
  if (await isDuplicatePost(input.userId, input.body)) {
    return { reason: 'duplicate' };
  }
  if (countLinks(input.body) > FEED_RATE_LIMITS.maxLinks) {
    return { reason: 'too_many_links' };
  }
  if (containsBannedWord(input.title) || containsBannedWord(input.body)) {
    return { hidden: true };
  }
  return null;
}

/** Revisiones de un comentario nuevo (el lenguaje prohibido aquí se rechaza). */
export async function reviewComment(input: {
  userId: string;
  body: string | null;
}): Promise<{ reason: GuardrailReason } | null> {
  if (!(await withinRateLimit(input.userId, 'comment'))) {
    return { reason: 'rate_limit' };
  }
  if (containsBannedWord(input.body)) {
    return { reason: 'banned_words' };
  }
  return null;
}

/** Mensaje para el autor según el motivo. */
export const GUARDRAIL_MESSAGES: Record<GuardrailReason, string> = {
  rate_limit: 'Has publicado demasiado seguido. Espera un rato antes de volver a intentarlo.',
  duplicate: 'Ya has publicado algo igual hace un momento.',
  too_many_links: `No se permiten más de ${FEED_RATE_LIMITS.maxLinks} enlaces por publicación.`,
  banned_words: 'El texto contiene lenguaje que no está permitido.',
};
