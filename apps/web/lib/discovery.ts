import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { DISCOVERY_PAGE_SIZE, DISCOVERY_SUGGESTED_PROFILES } from '@ifpc/config';
import { hiddenAuthorIds } from './discovery-privacy';
import {
  POST_INCLUDE,
  rankTrendingPosts,
  summarizePostViews,
  toFeedPost,
  ANON_VIEWER_ID,
  type FeedComment,
  type FeedFilters,
  type FeedNotification,
  type FeedPage,
  type FeedPost,
  type FeedRoleFilter,
  type PostViewStats,
  type ProfileSummary,
} from './discovery-content';

/** Tipos y funciones puras (client-safe) del feed. */
export * from './discovery-content';

const TRENDING_DAYS = 30;
const TRENDING_WINDOW = 60;

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/** Feed paginado (cursor = id del último post). Filtra por pestaña y etiqueta. */
export async function listFeed(input: {
  /** `null`/`undefined` en el espejo público (no hay "me gusta" del espectador). */
  viewerId?: string | null;
  filters: FeedFilters;
  cursor?: string | null;
  /** Publicaciones ya mostradas fuera del listado (p. ej. las fijadas). */
  excludeIds?: string[];
}): Promise<FeedPage> {
  const { filters, viewerId, cursor, excludeIds } = input;

  // Sin sesión no existe "Siguiendo": se devuelve una página vacía en vez de todo el feed.
  if (filters.tab === 'following' && !viewerId) {
    return { posts: [], nextCursor: null };
  }

  // Lo que el espectador ha bloqueado o silenciado (y quien le bloqueó) no aparece.
  const hidden = await hiddenAuthorIds(viewerId);

  const where = {
    status: 'PUBLISHED' as const,
    ...(hidden.length > 0 ? { authorId: { notIn: hidden } } : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.role ? { author: { role: filters.role } } : {}),
    ...(filters.tab === 'announcements' ? { type: 'ANNOUNCEMENT' as const } : {}),
    ...(filters.tab === 'videos' ? { type: 'VIDEO' as const } : {}),
    ...(filters.tab === 'following' && viewerId ? { OR: await followingFilter(viewerId) } : {}),
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
  const include = {
    ...POST_INCLUDE,
    ...(viewerId ? { likes: { where: { userId: viewerId }, select: { id: true } } } : {}),
  };

  if (filters.tab === 'trending') {
    const since = new Date(Date.now() - TRENDING_DAYS * 24 * 60 * 60 * 1000);
    const rows = await prisma.post.findMany({
      where: { ...where, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: TRENDING_WINDOW,
      include,
    });
    const posts = rankTrendingPosts(rows.map((row) => toFeedPost(row, viewerId))).slice(
      0,
      DISCOVERY_PAGE_SIZE
    );
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
    posts: page.map((row) => toFeedPost(row, viewerId)),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

/** Un perfil del directorio de Discovery (tipo en `discovery-content`). */
export type { ProfileSummary } from './discovery-content';

/**
 * Directorio de perfiles: busca por nombre y filtra por rol, ordenando por
 * actividad (publicaciones) y dejando fuera lo que el espectador bloqueó o silenció.
 */
export async function listProfiles(input: {
  q?: string | null;
  role?: FeedRoleFilter | null;
  viewerId?: string | null;
  limit?: number;
}): Promise<ProfileSummary[]> {
  const limit = input.limit ?? DISCOVERY_PAGE_SIZE;
  const hidden = await hiddenAuthorIds(input.viewerId);

  const users = await prisma.user.findMany({
    where: {
      ...(hidden.length > 0 ? { id: { notIn: hidden } } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.q ? { name: { contains: input.q, mode: 'insensitive' as const } } : {}),
    },
    orderBy: [{ posts: { _count: 'desc' } }, { createdAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      name: true,
      role: true,
      image: true,
      _count: { select: { posts: true, followers: true } },
    },
  });

  const follows =
    input.viewerId && users.length > 0
      ? await prisma.follow.findMany({
          where: {
            followerId: input.viewerId,
            followingId: { in: users.map((user) => user.id) },
          },
          select: { followingId: true },
        })
      : [];
  const followed = new Set(follows.map((follow) => follow.followingId));

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    image: user.image,
    posts: user._count.posts,
    followers: user._count.followers,
    isFollowing: followed.has(user.id),
  }));
}

/** Publicaciones fijadas por un admin (las más recientes primero). */
export async function listPinnedPosts(
  viewerId?: string | null,
  limit = 3
): Promise<FeedPost[]> {
  const hidden = await hiddenAuthorIds(viewerId);

  const rows = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      pinnedAt: { not: null },
      ...(hidden.length > 0 ? { authorId: { notIn: hidden } } : {}),
    },
    orderBy: { pinnedAt: 'desc' },
    take: limit,
    include: {
      ...POST_INCLUDE,
      ...(viewerId ? { likes: { where: { userId: viewerId }, select: { id: true } } } : {}),
    },
  });
  return rows.map((row) => toFeedPost(row, viewerId));
}

/**
 * Una publicación visible para el espectador. Sin sesión (espejo público) solo
 * se devuelven las publicadas.
 */
export async function getPostForViewer(
  postId: string,
  viewerId?: string | null
): Promise<FeedPost | null> {
  const row = await prisma.post.findFirst({
    where: {
      id: postId,
      ...(viewerId
        ? { OR: [{ status: 'PUBLISHED' as const }, { authorId: viewerId }] }
        : { status: 'PUBLISHED' as const }),
    },
    include: {
      ...POST_INCLUDE,
      ...(viewerId ? { likes: { where: { userId: viewerId }, select: { id: true } } } : {}),
    },
  });
  if (!row) return null;

  // Un bloqueo también cierra el acceso por enlace directo.
  if (viewerId && row.author.id !== viewerId) {
    const hidden = await hiddenAuthorIds(viewerId);
    if (hidden.includes(row.author.id)) return null;
  }

  return toFeedPost(row, viewerId);
}

/** Comentarios de una publicación, del más antiguo al más nuevo. */
export async function listComments(
  postId: string,
  viewerId?: string | null
): Promise<FeedComment[]> {
  const hidden = await hiddenAuthorIds(viewerId);

  return prisma.postComment.findMany({
    where: {
      postId,
      ...(hidden.length > 0 ? { authorId: { notIn: hidden } } : {}),
    },
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

/** Publicaciones publicadas de un autor (vacío si el espectador no puede verlas). */
export async function listPostsByAuthor(
  authorId: string,
  take = DISCOVERY_PAGE_SIZE,
  viewerId?: string | null
): Promise<FeedPost[]> {
  const hidden = await hiddenAuthorIds(viewerId);
  if (hidden.includes(authorId)) return [];

  const rows = await prisma.post.findMany({
    where: { authorId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take,
    include: POST_INCLUDE,
  });
  return rows.map((row) => toFeedPost(row, viewerId));
}

/** Borradores del autor (incluye los programados), los más recientes primero. */
export async function listDrafts(authorId: string, take = 10): Promise<FeedPost[]> {
  const rows = await prisma.post.findMany({
    where: { authorId, status: 'DRAFT' },
    orderBy: { createdAt: 'desc' },
    take,
    include: { ...POST_INCLUDE, likes: { where: { userId: authorId }, select: { id: true } } },
  });
  return rows.map((row) => toFeedPost(row, authorId));
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

export async function listNotifications(userId: string, limit = 8): Promise<FeedNotification[]> {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      count: true,
      read: true,
      createdAt: true,
    },
  });
}

/** Avisos pendientes (para el contador de la campana). */
export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

/** Alcance de una publicación (para el autor). */
export async function getPostViewStats(postId: string): Promise<PostViewStats> {
  const rows = await prisma.postView.findMany({
    where: { postId },
    select: { viewerRole: true, viewerUserId: true, viewCount: true },
  });
  return summarizePostViews(rows);
}

/**
 * Suma una apertura anónima del espejo público. Sin sesión no hay espectador
 * identificable, así que todas las visitas anónimas comparten fila y solo se
 * acumula el número de aperturas.
 */
export async function recordAnonymousView(postId: string): Promise<void> {
  try {
    await prisma.postView.upsert({
      where: { postId_viewerUserId: { postId, viewerUserId: ANON_VIEWER_ID } },
      update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      create: { postId, viewerUserId: ANON_VIEWER_ID, viewerRole: 'ANON' },
    });
  } catch {
    // Las métricas nunca deben romper la página.
  }
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
export async function getFollowStats(
  userId: string,
  viewerId?: string | null
): Promise<FollowStats> {
  const [followers, following, link] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    viewerId && userId !== viewerId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
          select: { id: true },
        })
      : Promise.resolve(null),
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
