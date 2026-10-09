import { prisma } from '@ifpc/database';
import {
  DISCOVERY_FORYOU_CANDIDATES,
  DISCOVERY_FORYOU_DAYS,
  DISCOVERY_PAGE_SIZE,
  DISCOVERY_RECRUITER_ROLES,
} from '@ifpc/config';
import { PLAYER_MATCH_THRESHOLD, matchOpportunity } from './matching';
import { toFeedPost, type FeedPost } from './discovery';
import { hiddenAuthorIds } from './discovery-privacy';
import { notInterestedPostIds } from './discovery-interest';

/**
 * "Para ti": ordena el feed con el motor de matching que ya usan las
 * oportunidades. Los criterios viven en `@ifpc/matching`; aquí solo se decide
 * **qué** se puntúa en cada dirección (jugador ↔ oportunidades).
 */

/** Oportunidad reducida a los criterios que evalúa el motor. */
export interface ScorableOpportunity {
  position: string | null;
  ageMin: number | null;
  ageMax: number | null;
}

/** Perfil de jugador reducido a lo que evalúa el motor. */
export interface ScorablePlayer {
  position: string | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  competitionLevel: string | null;
  status: string;
}

// ---------------------------------------------------------------------------
// Funciones puras
// ---------------------------------------------------------------------------

/**
 * Encaje de la oportunidad que comparte una publicación con el jugador que la
 * ve. `null` cuando la publicación no comparte ninguna oportunidad.
 */
export function relevanceForPlayer(
  opportunity: ScorableOpportunity | null,
  player: ScorablePlayer
): number | null {
  if (!opportunity) return null;
  return matchOpportunity(player, opportunity).total;
}

/**
 * Mejor encaje del autor (perfil de jugador) con las oportunidades abiertas del
 * espectador. `null` si el autor no es jugador o no hay oportunidades.
 */
export function relevanceForOpportunities(
  author: ScorablePlayer | null,
  opportunities: ScorableOpportunity[]
): number | null {
  if (!author || opportunities.length === 0) return null;
  return opportunities.reduce(
    (best, opportunity) => Math.max(best, matchOpportunity(author, opportunity).total),
    0
  );
}

/**
 * Ordena candidatos para "Para ti": primero los que superan el umbral de encaje
 * (de mayor a menor) y después el resto, conservando el orden de entrada (que ya
 * viene ordenado por fecha).
 */
export function rankForYou<T>(
  candidates: T[],
  scoreOf: (candidate: T) => number | null,
  threshold: number = PLAYER_MATCH_THRESHOLD
): T[] {
  const scored = candidates.map((item, index) => ({ item, index, score: scoreOf(item) }));

  const matches = scored
    .filter((entry) => entry.score !== null && entry.score >= threshold)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.index - b.index);

  const rest = scored.filter(
    (entry) => entry.score === null || (entry.score !== null && entry.score < threshold)
  );

  return [...matches, ...rest].map((entry) => entry.item);
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

type ViewerContext =
  | { kind: 'player'; player: ScorablePlayer }
  | { kind: 'recruiter'; opportunities: ScorableOpportunity[] }
  | { kind: 'none' };

/** Contexto del espectador: su perfil de jugador o sus oportunidades abiertas. */
async function viewerContext(input: {
  viewerId: string;
  viewerRole: string;
}): Promise<ViewerContext> {
  if (input.viewerRole === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: input.viewerId },
      select: {
        position: true,
        dateOfBirth: true,
        nationality: true,
        competitionLevel: true,
        status: true,
      },
    });
    return player ? { kind: 'player', player } : { kind: 'none' };
  }

  if (DISCOVERY_RECRUITER_ROLES.some((role) => role === input.viewerRole)) {
    const [club, university] = await Promise.all([
      prisma.club.findUnique({ where: { userId: input.viewerId }, select: { id: true } }),
      prisma.university.findUnique({ where: { userId: input.viewerId }, select: { id: true } }),
    ]);

    const owners: { clubId?: string; universityId?: string }[] = [];
    if (club) owners.push({ clubId: club.id });
    if (university) owners.push({ universityId: university.id });
    if (owners.length === 0) return { kind: 'none' };

    const opportunities = await prisma.opportunity.findMany({
      where: { status: 'OPEN', OR: owners },
      select: { position: true, ageMin: true, ageMax: true },
      take: 20,
    });
    return opportunities.length > 0 ? { kind: 'recruiter', opportunities } : { kind: 'none' };
  }

  return { kind: 'none' };
}

/**
 * Feed "Para ti". Sin contexto puntuable (familias, entrenadores, ojeadores,
 * escuelas, admin…) devuelve las publicaciones recientes tal cual, en vez de
 * inventar una relevancia que no se puede calcular.
 */
export async function listForYouFeed(input: {
  viewerId: string;
  viewerRole: string;
}): Promise<FeedPost[]> {
  const since = new Date(Date.now() - DISCOVERY_FORYOU_DAYS * 24 * 60 * 60 * 1000);
  // Lo bloqueado o silenciado por el espectador tampoco entra en "Para ti".
  const [hidden, hiddenPosts] = await Promise.all([
    hiddenAuthorIds(input.viewerId),
    notInterestedPostIds(input.viewerId),
  ]);

  const rows = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      createdAt: { gte: since },
      ...(hidden.length > 0 ? { authorId: { notIn: hidden } } : {}),
      ...(hiddenPosts.length > 0 ? { id: { notIn: hiddenPosts } } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: DISCOVERY_FORYOU_CANDIDATES,
    include: {
      author: { select: { id: true, name: true, role: true, image: true } },
      opportunity: {
        select: { id: true, title: true, position: true, ageMin: true, ageMax: true },
      },
      _count: { select: { likes: true, comments: true, views: true } },
      likes: { where: { userId: input.viewerId }, select: { id: true } },
    },
  });

  const context = await viewerContext(input);
  if (context.kind === 'none') {
    return rows.slice(0, DISCOVERY_PAGE_SIZE).map((row) => toFeedPost(row, input.viewerId));
  }

  // Para el caso reclutador hace falta el perfil de jugador de cada autor.
  const authorIds = [...new Set(rows.map((row) => row.author.id))];
  const authors =
    context.kind === 'recruiter' && authorIds.length > 0
      ? await prisma.player.findMany({
          where: { userId: { in: authorIds } },
          select: {
            userId: true,
            position: true,
            dateOfBirth: true,
            nationality: true,
            competitionLevel: true,
            status: true,
          },
        })
      : [];
  const authorsById = new Map(authors.map((author) => [author.userId, author]));

  const scored = rows.map((row) => {
    const relevance =
      context.kind === 'player'
        ? relevanceForPlayer(row.opportunity, context.player)
        : relevanceForOpportunities(authorsById.get(row.author.id) ?? null, context.opportunities);

    return { ...toFeedPost(row, input.viewerId), relevance };
  });

  return rankForYou(scored, (post) => post.relevance ?? null).slice(0, DISCOVERY_PAGE_SIZE);
}
