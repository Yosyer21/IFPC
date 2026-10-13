/**
 * Football Center: contenido de formación del jugador. Aquí viven las dos
 * dimensiones que organizan todo el área:
 *
 * - `kind`: si es un **curso** (lectura + quiz) o un **ejercicio** (para hacer).
 * - `ownerType`: quién lo publica, **general** (lo básico de la plataforma),
 *   **coach** (lo que prepara un entrenador para sus jugadores) o **club**.
 *
 * Única fuente de verdad: la usan la navegación, los filtros, las acciones y los
 * tests, así que añadir una categoría no obliga a tocar componentes.
 */

import {
  POST_IMAGE_MAX_BYTES,
  POST_IMAGE_MIME_EXT,
  POST_VIDEO_MAX_BYTES,
  POST_VIDEO_MIME_EXT,
} from './discovery';

// ---------------------------------------------------------------------------
// Tipo de contenido
// ---------------------------------------------------------------------------

export const TRAINING_KINDS = ['COURSE', 'EXERCISE'] as const;
export type TrainingKind = (typeof TRAINING_KINDS)[number];

export const TRAINING_KIND_LABELS: Record<TrainingKind, string> = {
  COURSE: 'Course',
  EXERCISE: 'Exercise',
};

export function isTrainingKind(value: unknown): value is TrainingKind {
  return typeof value === 'string' && (TRAINING_KINDS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Origen del contenido
// ---------------------------------------------------------------------------

export const TRAINING_ORIGINS = ['GENERAL', 'COACH', 'CLUB'] as const;
export type TrainingOrigin = (typeof TRAINING_ORIGINS)[number];

/** Etiquetas neutras: cada vista añade su contexto («From your coach»). */
export const TRAINING_ORIGIN_LABELS: Record<TrainingOrigin, string> = {
  GENERAL: 'General',
  COACH: 'Coach',
  CLUB: 'Club',
};

export function isTrainingOrigin(value: unknown): value is TrainingOrigin {
  return typeof value === 'string' && (TRAINING_ORIGINS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Categorías (mismas claves que `TrainingContent.category`)
// ---------------------------------------------------------------------------

export const TRAINING_CATEGORIES = [
  'technical',
  'strength-conditioning',
  'psychology',
  'parent-education',
] as const;
export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export const TRAINING_CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  'strength-conditioning': 'Strength & conditioning',
  psychology: 'Psychology',
  'parent-education': 'For families',
};

export function isTrainingCategory(value: unknown): value is TrainingCategory {
  return typeof value === 'string' && (TRAINING_CATEGORIES as readonly string[]).includes(value);
}

/** Etiqueta de categoría tolerante: lo desconocido se muestra tal cual. */
export function trainingCategoryLabel(value: string): string {
  return TRAINING_CATEGORY_LABELS[value] ?? value;
}

/** Categorías que puede elegir un coach o un club al publicar contenido. */
export const TRAINING_AUTHOR_CATEGORIES: readonly TrainingCategory[] = [
  'technical',
  'strength-conditioning',
  'psychology',
];

// ---------------------------------------------------------------------------
// Visibilidad (borrador, programado y publicado)
// ---------------------------------------------------------------------------

/** `DRAFT` solo lo ve el autor; `PUBLISHED` lo ve su audiencia. */
export const TRAINING_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export function isTrainingStatus(value: unknown): value is TrainingStatus {
  return typeof value === 'string' && (TRAINING_STATUSES as readonly string[]).includes(value);
}

/**
 * Estado efectivo del contenido para mostrarlo en una tarjeta: un `PUBLISHED`
 * con fecha futura está **programado** (aún no lo ve nadie).
 */
export type TrainingPublishState = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';

export const TRAINING_PUBLISH_STATE_LABELS: Record<TrainingPublishState, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
};

// ---------------------------------------------------------------------------
// Medios (portada y vídeo del contenido)
// ---------------------------------------------------------------------------

/** Portada y vídeo comparten formatos y límites con el feed de Discovery. */
export const TRAINING_IMAGE_MAX_BYTES = POST_IMAGE_MAX_BYTES;
export const TRAINING_VIDEO_MAX_BYTES = POST_VIDEO_MAX_BYTES;
export const TRAINING_IMAGE_MIME_EXT = POST_IMAGE_MIME_EXT;
export const TRAINING_VIDEO_MIME_EXT = POST_VIDEO_MIME_EXT;

// ---------------------------------------------------------------------------
// Programación
// ---------------------------------------------------------------------------

/** Margen mínimo para programar: evita fechas que ya pasaron por la latencia. */
export const TRAINING_SCHEDULE_MIN_LEAD_MINUTES = 5;
