import { prisma } from '@ifpc/database';
import { ANON_VIEWER_ID, engagementScore } from './discovery-content';

/**
 * Analítica de Discovery: rendimiento del autor y salud del feed.
 *
 * Las funciones `summarize*` / `bucket*` / `average*` son **puras** (fáciles de
 * testear) y las `get*` solo consultan y delegan en ellas.
 */

// ---------------------------------------------------------------------------
// Funciones puras
// ---------------------------------------------------------------------------

/** Hora del servidor (UTC) con mejor engagement medio, o `null` sin datos. */
export function bestPostingHour(items: { createdAt: Date; score: number }[]): number | null {
  const byHour = new Map<number, { total: number; count: number }>();

  for (const item of items) {
    const hour = item.createdAt.getUTCHours();
    const current = byHour.get(hour) ?? { total: 0, count: 0 };
    byHour.set(hour, { total: current.total + item.score, count: current.count + 1 });
  }

  let best: { hour: number; average: number } | null = null;
  for (const [hour, bucket] of byHour) {
    const average = bucket.count > 0 ? bucket.total / bucket.count : 0;
    if (!best || average > best.average) best = { hour, average };
  }

  return best ? best.hour : null;
}

/** Cuenta etiquetas y devuelve las más usadas (desempate alfabético). */
export function countTags(tagLists: string[][], limit = 6): { tag: string; posts: number }[] {
  const counts = new Map<string, number>();
  for (const tags of tagLists) {
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([tag, posts]) => ({ tag, posts }))
    .sort((a, b) => b.posts - a.posts || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

/** Reparte fechas en los últimos `days` días (incluye los días sin actividad). */
export function bucketPostsByDay(
  dates: Date[],
  days: number,
  now: Date = new Date()
): { day: string; posts: number }[] {
  const buckets = new Map<string, number>();
  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(now.getTime() - index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    buckets.set(day, 0);
  }

  for (const date of dates) {
    const day = date.toISOString().slice(0, 10);
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([day, posts]) => ({ day, posts }));
}

/** Horas medias hasta atender una denuncia (o `null` si no hay ninguna). */
export function averageResolutionHours(
  items: { createdAt: Date; resolvedAt: Date | null }[]
): number | null {
  const resolved = items.filter(
    (item): item is { createdAt: Date; resolvedAt: Date } => item.resolvedAt !== null
  );
  if (resolved.length === 0) return null;

  const total = resolved.reduce(
    (sum, item) => sum + (item.resolvedAt.getTime() - item.createdAt.getTime()),
    0
  );
  return Math.round((total / resolved.length / (60 * 60 * 1000)) * 10) / 10;
}

/** Fila mínima para agregar el rendimiento de un autor. */
export interface AuthorPostRow {
  id: string;
  label: string;
  tags: string[];
  createdAt: Date;
  likes: number;
  comments: number;
  /** Personas distintas que la abrieron. */
  viewers: number;
  /** Aperturas anónimas (espejo público). */
  anonymousViews: number;
}

export interface AuthorAnalytics {
  posts: number;
  reach: number;
  anonymousOpenings: number;
  likes: number;
  comments: number;
  engagement: number;
  topPosts: { id: string; label: string; score: number }[];
  topTags: { tag: string; posts: number }[];
  bestHour: number | null;
}

/** Agrega el rendimiento de las publicaciones de un autor. */
export function summarizeAuthorAnalytics(rows: AuthorPostRow[]): AuthorAnalytics {
  const scored = rows.map((row) => ({
    row,
    score: engagementScore({
      counts: { likes: row.likes, comments: row.comments, views: row.viewers },
    }),
  }));

  return {
    posts: rows.length,
    reach: rows.reduce((sum, row) => sum + row.viewers, 0),
    anonymousOpenings: rows.reduce((sum, row) => sum + row.anonymousViews, 0),
    likes: rows.reduce((sum, row) => sum + row.likes, 0),
    comments: rows.reduce((sum, row) => sum + row.comments, 0),
    engagement: scored.reduce((sum, entry) => sum + entry.score, 0),
    topPosts: [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => ({ id: entry.row.id, label: entry.row.label, score: entry.score })),
    topTags: countTags(rows.map((row) => row.tags)),
    bestHour: bestPostingHour(
      scored.map((entry) => ({ createdAt: entry.row.createdAt, score: entry.score }))
    ),
  };
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export interface FeedHealth {
  published: number;
  hidden: number;
  pendingReports: number;
  /** Denuncias pendientes por cada 100 publicaciones. */
  reportRatePer100: number;
  /** Autores distintos que han publicado en los últimos 30 días. */
  activeAuthors: number;
  /** Publicaciones por día en las últimas dos semanas. */
  postsByDay: { day: string; posts: number }[];
  topTags: { tag: string; posts: number }[];
  averageResolutionHours: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Rendimiento del autor en Discovery (alcance, engagement, etiquetas y hora). */
export async function getAuthorAnalytics(authorId: string): Promise<AuthorAnalytics> {
  const posts = await prisma.post.findMany({
    where: { authorId, status: { in: ['PUBLISHED', 'HIDDEN'] } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      body: true,
      tags: true,
      createdAt: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (posts.length === 0) return summarizeAuthorAnalytics([]);

  const views = await prisma.postView.findMany({
    where: { postId: { in: posts.map((post) => post.id) } },
    select: { postId: true, viewerUserId: true, viewCount: true },
  });

  const viewsByPost = new Map<string, { viewers: number; anonymous: number }>();
  for (const view of views) {
    const current = viewsByPost.get(view.postId) ?? { viewers: 0, anonymous: 0 };
    if (view.viewerUserId === ANON_VIEWER_ID) current.anonymous += view.viewCount;
    else current.viewers += 1;
    viewsByPost.set(view.postId, current);
  }

  return summarizeAuthorAnalytics(
    posts.map((post) => ({
      id: post.id,
      label: post.title ?? (post.body ?? '').slice(0, 60) ?? 'Publicación',
      tags: post.tags,
      createdAt: post.createdAt,
      likes: post._count.likes,
      comments: post._count.comments,
      viewers: viewsByPost.get(post.id)?.viewers ?? 0,
      anonymousViews: viewsByPost.get(post.id)?.anonymous ?? 0,
    }))
  );
}

/** Salud del feed para el panel de admin. */
export async function getFeedHealth(now: Date = new Date()): Promise<FeedHealth> {
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const since14 = new Date(now.getTime() - 14 * DAY_MS);

  const [published, hidden, pendingReports, resolvedReports, recent, tagged, authors] =
    await Promise.all([
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'HIDDEN' } }),
      prisma.postReport.count({ where: { resolvedAt: null } }),
      prisma.postReport.findMany({
        where: { resolvedAt: { not: null }, createdAt: { gte: since30 } },
        select: { createdAt: true, resolvedAt: true },
        take: 200,
      }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED', createdAt: { gte: since14 } },
        select: { createdAt: true },
        take: 1000,
      }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        select: { tags: true },
        take: 500,
      }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED', createdAt: { gte: since30 } },
        select: { authorId: true },
        distinct: ['authorId'],
        take: 1000,
      }),
    ]);

  return {
    published,
    hidden,
    pendingReports,
    reportRatePer100: published > 0 ? Math.round((pendingReports / published) * 1000) / 10 : 0,
    activeAuthors: authors.length,
    postsByDay: bucketPostsByDay(
      recent.map((post) => post.createdAt),
      14,
      now
    ),
    topTags: countTags(tagged.map((post) => post.tags)),
    averageResolutionHours: averageResolutionHours(resolvedReports),
  };
}
