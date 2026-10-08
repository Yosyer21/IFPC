import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import {
  DEFAULT_DISCOVERY_TAB,
  DISCOVERY_PAGE_SIZE,
  DISCOVERY_SUGGESTED_PROFILES,
  DISCOVERY_TABS,
  EMBED_ALLOWED_HOSTS,
  type DiscoveryTab,
} from '@ifpc/config';
import { POST_TAGS_MAX, POST_TAG_MAX } from '@ifpc/validation';

/** Filtros activos del feed (provienen de `?tab=`, `?tag=` y `?q=`). */
export interface FeedFilters {
  tab: DiscoveryTab;
  tag: string | null;
  /** Búsqueda por texto: título, cuerpo o autor. */
  q: string | null;
}

/** Longitud máxima (y mínima) de la búsqueda del feed. */
export const FEED_QUERY_MAX = 60;
const FEED_QUERY_MIN = 2;

/** Publicación ya normalizada para la UI. */
export interface FeedPost {
  id: string;
  type: string;
  status: string;
  title: string | null;
  body: string | null;
  mediaUrl: string | null;
  mediaKind: string | null;
  linkUrl: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  author: { id: string; name: string; role: string; image: string | null };
  opportunity: { id: string; title: string } | null;
  counts: { likes: number; comments: number; views: number };
  likedByMe: boolean;
  /** Solo lo rellena la pestaña "Para ti": encaje con el perfil (0-100). */
  relevance?: number | null;
}

export interface FeedComment {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: Date;
  author: { id: string; name: string; role: string; image: string | null };
}

export interface FeedPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

/** Ventana temporal del ranking de tendencias (días) y candidatos que se puntúan. */
const TRENDING_DAYS = 30;
const TRENDING_WINDOW = 60;

const AUTHOR_SELECT = {
  select: { id: true, name: true, role: true, image: true },
} as const;

const POST_INCLUDE = {
  author: AUTHOR_SELECT,
  opportunity: { select: { id: true, title: true } },
  _count: { select: { likes: true, comments: true, views: true } },
} as const;

/** Forma (estructural) de las filas que devuelven las consultas del feed. */
interface FeedRow {
  id: string;
  type: string;
  status: string;
  title: string | null;
  body: string | null;
  mediaUrl: string | null;
  mediaKind: string | null;
  linkUrl: string | null;
  tags: string[];
  pinnedAt: Date | null;
  createdAt: Date;
  author: { id: string; name: string; role: string; image: string | null };
  opportunity: { id: string; title: string } | null;
  _count: { likes: number; comments: number; views: number };
  likes?: { id: string }[];
}

// ---------------------------------------------------------------------------
// Funciones puras
// ---------------------------------------------------------------------------

/** Normaliza `?tab=`, `?tag=` y `?q=` (valores desconocidos → por defecto / sin filtro). */
export function parseFeedFilters(
  params: { tab?: string; tag?: string; q?: string } = {}
): FeedFilters {
  const tab = DISCOVERY_TABS.find((value) => value === params.tab) ?? DEFAULT_DISCOVERY_TAB;
  const raw = (params.tag ?? '').trim().replace(/^#+/, '').toLowerCase();
  const valid = raw.length > 0 && raw.length <= POST_TAG_MAX && /^[a-z0-9][a-z0-9_-]*$/.test(raw);
  // La búsqueda se limita y se colapsa el espacio para no golpear la base con textos absurdos.
  const query = (params.q ?? '').replace(/\s+/g, ' ').trim().slice(0, FEED_QUERY_MAX);

  return {
    tab,
    tag: valid ? raw : null,
    q: query.length >= FEED_QUERY_MIN ? query : null,
  };
}

/** Extrae los `#hashtags` del texto y los une a las etiquetas ya declaradas. */
export function extractTags(body: string | null | undefined, explicit: string[] = []): string[] {
  const all = [...explicit];
  for (const match of body?.matchAll(/#([\p{L}\p{N}_-]{2,24})/gu) ?? []) {
    const tag = match[1];
    if (tag) all.push(tag);
  }

  const unique: string[] = [];
  for (const tag of all) {
    const clean = tag.replace(/^#+/, '').toLowerCase();
    if (clean && !unique.includes(clean)) unique.push(clean);
  }
  return unique.slice(0, POST_TAGS_MAX);
}

/**
 * Devuelve la URL de incrustación de un vídeo externo o `null` si el origen no
 * está en la lista blanca (evita inyectar un `iframe` a un origen arbitrario).
 */
export function resolveEmbed(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const host = parsed.hostname.toLowerCase();
  if (!EMBED_ALLOWED_HOSTS.includes(host)) return null;

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0] ?? '';
    return /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host.endsWith('youtube.com')) {
    const path = parsed.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1];
    const id = parsed.searchParams.get('v') ?? path ?? null;
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host.endsWith('vimeo.com')) {
    const id = parsed.pathname.match(/(\d{6,})/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

/** Puntuación de engagement: los comentarios pesan más que los likes. */
export function engagementScore(post: Pick<FeedPost, 'counts'>): number {
  return post.counts.likes * 3 + post.counts.comments * 2 + post.counts.views;
}

/** Ordena por engagement (y, a igualdad, por más reciente). */
export function rankTrendingPosts<T extends Pick<FeedPost, 'counts' | 'createdAt'>>(
  posts: T[]
): T[] {
  return [...posts].sort((a, b) => {
    const diff = engagementScore(b) - engagementScore(a);
    return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/** Texto relativo corto ("ahora", "hace 5 min"…). */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/** Campos de `PostView` necesarios para agregar el alcance de una publicación. */
export interface PostViewRow {
  viewerRole: string;
  viewCount: number;
}

export interface PostViewStats {
  /** Personas distintas que han abierto la publicación. */
  viewers: number;
  /** Aperturas totales (incluye repetidas de la misma persona). */
  views: number;
  byRole: { role: string; viewers: number }[];
}

/** Agrega el alcance de un post por rol (mismo criterio que `ProfileView`). */
export function summarizePostViews(rows: PostViewRow[]): PostViewStats {
  const byRole = new Map<string, number>();
  for (const row of rows) {
    byRole.set(row.viewerRole, (byRole.get(row.viewerRole) ?? 0) + 1);
  }

  return {
    viewers: rows.length,
    views: rows.reduce((sum, row) => sum + row.viewCount, 0),
    byRole: [...byRole.entries()]
      .map(([role, viewers]) => ({ role, viewers }))
      .sort((a, b) => b.viewers - a.viewers),
  };
}

export function toFeedPost(row: FeedRow): FeedPost {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    body: row.body,
    mediaUrl: row.mediaUrl,
    mediaKind: row.mediaKind,
    linkUrl: row.linkUrl,
    tags: row.tags,
    pinned: row.pinnedAt !== null,
    createdAt: row.createdAt,
    author: row.author,
    opportunity: row.opportunity,
    counts: {
      likes: row._count.likes,
      comments: row._count.comments,
      views: row._count.views,
    },
    likedByMe: (row.likes?.length ?? 0) > 0,
  };
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/** Feed paginado (cursor = id del último post). Filtra por pestaña y etiqueta. */
export async function listFeed(input: {
  viewerId: string;
  filters: FeedFilters;
  cursor?: string | null;
  /** Publicaciones ya mostradas fuera del listado (p. ej. las fijadas). */
  excludeIds?: string[];
}): Promise<FeedPage> {
  const { filters, viewerId, cursor, excludeIds } = input;
  const where = {
    status: 'PUBLISHED' as const,
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.tab === 'announcements' ? { type: 'ANNOUNCEMENT' as const } : {}),
    ...(filters.tab === 'videos' ? { type: 'VIDEO' as const } : {}),
    ...(filters.tab === 'following' ? { OR: await followingFilter(viewerId) } : {}),
    // La búsqueda se añade con AND: combina con la pestaña en vez de sustituirla.
    ...(filters.q
      ? {
          AND: [
            {
              OR: [
                { title: { contains: filters.q, mode: 'insensitive' as const } },
                { body: { contains: filters.q, mode: 'insensitive' as const } },
                { author: { name: { contains: filters.q, mode: 'insensitive' as const } } },
              ],
            },
          ],
        }
      : {}),
    ...(excludeIds && excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
  };
  const include = { ...POST_INCLUDE, likes: { where: { userId: viewerId }, select: { id: true } } };

  if (filters.tab === 'trending') {
    const since = new Date(Date.now() - TRENDING_DAYS * 24 * 60 * 60 * 1000);
    const rows = await prisma.post.findMany({
      where: { ...where, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: TRENDING_WINDOW,
      include,
    });
    const posts = rankTrendingPosts(rows.map(toFeedPost)).slice(0, DISCOVERY_PAGE_SIZE);
    return { posts, nextCursor: null };
  }

  const rows = await prisma.post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: DISCOVERY_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include,
  });

  const hasMore = rows.length > DISCOVERY_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, DISCOVERY_PAGE_SIZE) : rows;
  return {
    posts: page.map(toFeedPost),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

/** Publicaciones fijadas por un admin (las más recientes primero). */
export async function listPinnedPosts(viewerId: string, limit = 3): Promise<FeedPost[]> {
  const rows = await prisma.post.findMany({
    where: { status: 'PUBLISHED', pinnedAt: { not: null } },
    orderBy: { pinnedAt: 'desc' },
    take: limit,
    include: { ...POST_INCLUDE, likes: { where: { userId: viewerId }, select: { id: true } } },
  });
  return rows.map(toFeedPost);
}

/** Una publicación visible para el espectador (o `null` si no existe/sin permiso). */
export async function getPostForViewer(postId: string, viewerId: string): Promise<FeedPost | null> {
  const row = await prisma.post.findFirst({
    where: { id: postId, OR: [{ status: 'PUBLISHED' }, { authorId: viewerId }] },
    include: { ...POST_INCLUDE, likes: { where: { userId: viewerId }, select: { id: true } } },
  });
  return row ? toFeedPost(row) : null;
}

/** Comentarios de una publicación, del más antiguo al más nuevo. */
export async function listComments(postId: string): Promise<FeedComment[]> {
  return prisma.postComment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: {
      id: true,
      body: true,
      parentId: true,
      createdAt: true,
      author: { select: { id: true, name: true, role: true, image: true } },
    },
  });
}

/** Publicaciones publicadas de un autor. */
export async function listPostsByAuthor(
  authorId: string,
  take = DISCOVERY_PAGE_SIZE
): Promise<FeedPost[]> {
  const rows = await prisma.post.findMany({
    where: { authorId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take,
    include: POST_INCLUDE,
  });
  return rows.map(toFeedPost);
}

/** Suma una apertura al registro del espectador (un registro por post + persona). */
export async function recordPostView(input: {
  postId: string;
  viewerUserId: string;
  viewerRole: string;
}): Promise<void> {
  try {
    await prisma.postView.upsert({
      where: { postId_viewerUserId: { postId: input.postId, viewerUserId: input.viewerUserId } },
      update: { viewerRole: input.viewerRole, viewCount: { increment: 1 }, lastViewedAt: new Date() },
      create: input,
    });
  } catch {
    // Las métricas nunca deben romper la página.
  }
}

/**
 * Registra la apertura cuando hay sesión y el espectador no es el autor.
 * Se llama al renderizar el detalle de una publicación.
 */
export async function trackPostView(input: { postId: string; authorUserId: string }): Promise<void> {
  const session = await auth();
  const viewer = session?.user;
  if (!viewer?.id || viewer.id === input.authorUserId) return;

  await recordPostView({
    postId: input.postId,
    viewerUserId: viewer.id,
    viewerRole: viewer.role ?? '',
  });
}

/** Alcance de una publicación (para el autor). */
export async function getPostViewStats(postId: string): Promise<PostViewStats> {
  const rows = await prisma.postView.findMany({
    where: { postId },
    select: { viewerRole: true, viewCount: true },
  });
  return summarizePostViews(rows);
}

// ---------------------------------------------------------------------------
// Relación social (seguir / seguidores)
// ---------------------------------------------------------------------------

/** Filtro de la pestaña "Siguiendo": publicaciones de los perfiles seguidos + las propias. */
type FollowingFilter = { authorId: string } | { authorId: { in: string[] } };

async function followingFilter(viewerId: string): Promise<FollowingFilter[]> {
  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
    take: 500,
  });
  const ids = follows.map((follow) => follow.followingId);
  return ids.length > 0
    ? [{ authorId: { in: ids } }, { authorId: viewerId }]
    : [{ authorId: viewerId }];
}

export interface FollowStats {
  followers: number;
  following: number;
  isFollowing: boolean;
}

/** Contadores del muro y estado del botón "Seguir" para el espectador. */
export async function getFollowStats(userId: string, viewerId: string): Promise<FollowStats> {
  const [followers, following, link] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    userId === viewerId
      ? Promise.resolve(null)
      : prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
          select: { id: true },
        }),
  ]);

  return { followers, following, isFollowing: link !== null };
}

export interface SuggestedProfile {
  id: string;
  name: string;
  role: string;
  image: string | null;
  followers: number;
  posts: number;
}

/**
 * Perfiles sugeridos: los más seguidos que el espectador aún no sigue, con su
 * número de publicaciones para dar contexto.
 */
export async function listSuggestedProfiles(
  viewerId: string,
  limit = DISCOVERY_SUGGESTED_PROFILES
): Promise<SuggestedProfile[]> {
  const [followed, ranking] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
    prisma.follow.groupBy({
      by: ['followingId'],
      _count: { followingId: true },
      orderBy: { _count: { followingId: 'desc' } },
      take: 40,
    }),
  ]);

  const excluded = new Set([viewerId, ...followed.map((follow) => follow.followingId)]);
  const candidates = ranking.filter((row) => !excluded.has(row.followingId)).slice(0, limit);
  if (candidates.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: candidates.map((row) => row.followingId) } },
    select: { id: true, name: true, role: true, image: true, _count: { select: { posts: true } } },
  });
  const byId = new Map(users.map((user) => [user.id, user]));

  return candidates.flatMap((row) => {
    const user = byId.get(row.followingId);
    if (!user) return [];
    return [
      {
        id: user.id,
        name: user.name,
        role: user.role,
        image: user.image,
        followers: row._count.followingId,
        posts: user._count.posts,
      },
    ];
  });
}
