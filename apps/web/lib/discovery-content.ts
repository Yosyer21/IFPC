/**
 * Discovery (contenido): tipos, constantes y funciones **puras** del feed.
 *
 * Es *client-safe* a proposito: no importa Prisma ni la sesion, para que los
 * componentes de cliente puedan reutilizarlo. Las consultas viven en
 * `lib/discovery.ts`, que reexporta este modulo para los consumidores de
 * servidor (asi no cambia ningun import existente).
 */

import {
  DEFAULT_DISCOVERY_TAB,
  DISCOVERY_TABS,
  EMBED_ALLOWED_HOSTS,
  type DiscoveryTab,
} from '@ifpc/config';
import { POST_TAGS_MAX, POST_TAG_MAX } from '@ifpc/validation';

/** Filtros activos del feed (provienen de `?tab=`, `?tag=`, `?q=`, `?type=` y `?role=`). */
export interface FeedFilters {
  tab: DiscoveryTab;
  tag: string | null;
  /** Búsqueda por texto: título, cuerpo o autor. */
  q: string | null;
  /** Tipo de publicación (`PostType`). */
  type: FeedTypeFilter | null;
  /** Rol del autor (`Role`). */
  role: FeedRoleFilter | null;
}

/** Longitud máxima (y mínima) de la búsqueda del feed. */
export const FEED_QUERY_MAX = 60;
const FEED_QUERY_MIN = 2;

/** Tipos y roles aceptados como filtro del feed (mismos valores que los enums). */
export const FEED_TYPE_FILTERS = ['ANNOUNCEMENT', 'VIDEO', 'PHOTO', 'ACHIEVEMENT'] as const;
export const FEED_ROLE_FILTERS = [
  'PLAYER',
  'PARENT',
  'COACH',
  'SCOUT',
  'AGENT',
  'CLUB',
  'UNIVERSITY',
  'SCHOOL',
  'ADMIN',
] as const;
export type FeedRoleFilter = (typeof FEED_ROLE_FILTERS)[number];
type FeedTypeFilter = (typeof FEED_TYPE_FILTERS)[number];

/** Un perfil del directorio de Discovery. */
export interface ProfileSummary {
  id: string;
  name: string;
  role: string;
  image: string | null;
  posts: number;
  followers: number;
  /** Solo se rellena cuando hay espectador con sesión. */
  isFollowing: boolean;
}

/**
 * Pestañas disponibles **sin sesión** (espejo público): "Para ti" y "Siguiendo"
 * necesitan saber quién mira.
 */
export const PUBLIC_DISCOVERY_TABS = [
  'profiles',
  'recent',
  'trending',
  'announcements',
  'videos',
] as const;

/** Ajusta los filtros al espejo público: descarta las pestañas que exigen sesión. */
export function publicFeedFilters(filters: FeedFilters): FeedFilters {
  const tab = PUBLIC_DISCOVERY_TABS.some((value) => value === filters.tab)
    ? filters.tab
    : DEFAULT_DISCOVERY_TAB;

  return { ...filters, tab: tab as DiscoveryTab };
}

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
  /** Quién puede comentar (`EVERYONE` | `FOLLOWERS` | `NOBODY`). */
  commentsPolicy: string;
  /** Galería de imágenes subidas (sin incluir el medio principal). */
  mediaUrls: string[];
  /** Texto alternativo del medio (accesibilidad). */
  mediaAlt: string | null;
  /** Fecha programada de publicación (si sigue siendo un borrador). */
  scheduledAt: Date | null;
  /** Opciones de encuesta (vacío si no hay). */
  pollOptions: string[];
  /** Votos por opción (mismo orden que `pollOptions`). */
  pollCounts: number[];
  /** Opción votada por el espectador, o `null`. */
  myPollVote: number | null;
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
const AUTHOR_SELECT = {
  select: { id: true, name: true, role: true, image: true },
} as const;

/** Selección reutilizada por las consultas del feed (también desde `discovery.ts`). */
export const POST_INCLUDE = {
  author: AUTHOR_SELECT,
  opportunity: { select: { id: true, title: true } },
  _count: { select: { likes: true, comments: true, views: true } },
  pollVotes: { select: { optionIndex: true, userId: true } },
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
  commentsPolicy: string;
  mediaUrls: string[];
  mediaAlt: string | null;
  publishAt: Date | null;
  pollOptions: string[];
  pollVotes?: { optionIndex: number; userId: string }[];
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

/** Normaliza `?tab=`, `?tag=`, `?q=`, `?type=` y `?role=` (desconocidos → sin filtro). */
export function parseFeedFilters(
  params: { tab?: string; tag?: string; q?: string; type?: string; role?: string } = {}
): FeedFilters {
  const tab = DISCOVERY_TABS.find((value) => value === params.tab) ?? DEFAULT_DISCOVERY_TAB;
  const raw = (params.tag ?? '').trim().replace(/^#+/, '').toLowerCase();
  const valid = raw.length > 0 && raw.length <= POST_TAG_MAX && /^[a-z0-9][a-z0-9_-]*$/.test(raw);
  // La búsqueda se limita y se colapsa el espacio para no golpear la base con textos absurdos.
  const query = (params.q ?? '').replace(/\s+/g, ' ').trim().slice(0, FEED_QUERY_MAX);
  const type = (params.type ?? '').toUpperCase();
  const role = (params.role ?? '').toUpperCase();

  return {
    tab,
    tag: valid ? raw : null,
    q: query.length >= FEED_QUERY_MIN ? query : null,
    type: FEED_TYPE_FILTERS.find((value) => value === type) ?? null,
    role: FEED_ROLE_FILTERS.find((value) => value === role) ?? null,
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
  /** `anonymous` en las aperturas del espejo público (sin espectador identificable). */
  viewerUserId?: string;
}

export interface PostViewStats {
  /** Personas distintas que han abierto la publicación (sin contar el anónimo). */
  viewers: number;
  /** Aperturas totales (incluye repetidas de la misma persona). */
  views: number;
  /** Aperturas desde el espejo público, donde no hay espectador identificable. */
  anonymousViews: number;
  byRole: { role: string; viewers: number }[];
}

/** Clave con la que se agrupan las aperturas anónimas del espejo público. */
export const ANON_VIEWER_ID = 'anonymous';

/** La galería admite hasta cuatro imágenes subidas. */
export const POST_GALLERY_MAX = 4;

/**
 * Candidatos de mención (`@Nombre Apellido`): el `@` no puede venir pegado a
 * una palabra (evita los correos) y el nombre empieza en mayúscula, hasta dos
 * palabras. La resolución contra perfiles reales la hace la acción, que ignora
 * lo que no exista.
 */
export function extractMentions(
  text: string | null | undefined,
  limit = 5
): string[] {
  if (!text) return [];

  const found: string[] = [];
  const pattern = /(?<![\p{L}\p{N}._-])@(\p{Lu}[\p{L}\p{N}._-]*(?:\s\p{Lu}[\p{L}\p{N}._-]*)?)/gu;
  for (const match of text.matchAll(pattern)) {
    const name = (match[1] ?? '').trim();
    if (name && !found.some((value) => value.toLowerCase() === name.toLowerCase())) {
      found.push(name);
    }
  }
  return found.slice(0, limit);
}

/** Reparto de votos de una encuesta (mismo orden que las opciones). */
export function countPollVotes(optionCount: number, votes: { optionIndex: number }[]): number[] {
  return Array.from({ length: optionCount }, (_value, index) =>
    votes.filter((vote) => vote.optionIndex === index).length
  );
}

/** Agrega el alcance de un post por rol, separando las aperturas anónimas. */
export function summarizePostViews(rows: PostViewRow[]): PostViewStats {
  const byRole = new Map<string, number>();
  let viewers = 0;
  let anonymousViews = 0;

  for (const row of rows) {
    if (row.viewerUserId === ANON_VIEWER_ID) {
      anonymousViews += row.viewCount;
      continue;
    }
    viewers += 1;
    byRole.set(row.viewerRole, (byRole.get(row.viewerRole) ?? 0) + 1);
  }

  return {
    viewers,
    views: rows.reduce((sum, row) => sum + row.viewCount, 0),
    anonymousViews,
    byRole: [...byRole.entries()]
      .map(([role, roleViewers]) => ({ role, viewers: roleViewers }))
      .sort((a, b) => b.viewers - a.viewers),
  };
}

export function toFeedPost(row: FeedRow, viewerId?: string | null): FeedPost {
  const pollVotes = row.pollVotes ?? [];
  const pollOptions = row.pollOptions ?? [];

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
    commentsPolicy: row.commentsPolicy,
    mediaUrls: row.mediaUrls ?? [],
    mediaAlt: row.mediaAlt,
    scheduledAt: row.publishAt,
    pollOptions,
    pollCounts: countPollVotes(pollOptions.length, pollVotes),
    myPollVote: viewerId
      ? (pollVotes.find((vote) => vote.userId === viewerId)?.optionIndex ?? null)
      : null,
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

/** Avisos del usuario para la campana del feed (los más recientes primero). */
export interface FeedNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  count: number;
  read: boolean;
  createdAt: Date;
}
