/**
 * Discovery: red social interna de la plataforma. Constantes compartidas por la
 * validación, las server actions y la UI (un solo sitio para cambiar límites).
 */

/** Tipos de publicación del feed. */
export const POST_TYPES = ['ANNOUNCEMENT', 'VIDEO', 'PHOTO', 'ACHIEVEMENT'] as const;
export type PostTypeValue = (typeof POST_TYPES)[number];

export const POST_TYPE_LABELS: Record<string, string> = {
  ANNOUNCEMENT: 'Anuncio',
  VIDEO: 'Vídeo',
  PHOTO: 'Foto',
  ACHIEVEMENT: 'Logro',
};

/** Estados: `HIDDEN` solo lo aplica un admin (moderación). */
export const POST_STATUSES = ['DRAFT', 'PUBLISHED', 'HIDDEN'] as const;
export type PostStatusValue = (typeof POST_STATUSES)[number];

/** Roles con permiso de publicación (todos los perfiles de la plataforma). */
export const POSTING_ROLES = [
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

/** Pestañas del feed (`?tab=`). */
export const DISCOVERY_TABS = ['recent', 'trending', 'announcements', 'videos'] as const;
export type DiscoveryTab = (typeof DISCOVERY_TABS)[number];
export const DEFAULT_DISCOVERY_TAB: DiscoveryTab = 'recent';

export const DISCOVERY_TAB_LABELS: Record<string, string> = {
  recent: 'Recientes',
  trending: 'Tendencias',
  announcements: 'Anuncios',
  videos: 'Vídeos',
};

/** Tamaño de página del feed (cursor-based). */
export const DISCOVERY_PAGE_SIZE = 20;

/** Límites de subida (los límites de caracteres viven en `@ifpc/validation`). */
export const POST_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const POST_VIDEO_MAX_BYTES = 25 * 1024 * 1024;

/** MIME aceptados → extensión con la que se guarda el fichero. */
export const POST_IMAGE_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const POST_VIDEO_MIME_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

/**
 * Dominios permitidos para vídeo externo incrustado (lista blanca: evita
 * inyectar un `<iframe>` a un origen arbitrario).
 */
export const EMBED_ALLOWED_HOSTS: readonly string[] = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
];
