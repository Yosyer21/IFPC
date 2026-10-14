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
// Destinatarios (toda la audiencia o solo los elegidos)
// ---------------------------------------------------------------------------

/** A quién va dirigido el contenido o la sesión. */
export const TRAINING_SCOPES = ['AUDIENCE', 'SELECTED'] as const;
export type TrainingScope = (typeof TRAINING_SCOPES)[number];

export const TRAINING_SCOPE_LABELS: Record<TrainingScope, string> = {
  AUDIENCE: 'All your players',
  SELECTED: 'Only the players you pick',
};

/** Opciones del desplegable de destinatarios. */
export const TRAINING_SCOPE_OPTIONS: { value: string; label: string }[] = TRAINING_SCOPES.map(
  (scope) => ({ value: scope, label: TRAINING_SCOPE_LABELS[scope] })
);

export function isTrainingScope(value: unknown): value is TrainingScope {
  return typeof value === 'string' && (TRAINING_SCOPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Medios (portada y vídeo del contenido)
// ---------------------------------------------------------------------------

/** Portada y vídeo comparten formatos y límites con el feed de Discovery. */
export const TRAINING_IMAGE_MAX_BYTES = POST_IMAGE_MAX_BYTES;
export const TRAINING_VIDEO_MAX_BYTES = POST_VIDEO_MAX_BYTES;
export const TRAINING_IMAGE_MIME_EXT = POST_IMAGE_MIME_EXT;
export const TRAINING_VIDEO_MIME_EXT = POST_VIDEO_MIME_EXT;

// ---------------------------------------------------------------------------
// Ejercicio estructurado (ficha de campo)
// ---------------------------------------------------------------------------

/**
 * Material de entrenamiento. Es la lista que ofrece el formulario y la que
 * valida `packages/validation` (los tests comprueban que no se desincronizan).
 */
export const TRAINING_EQUIPMENT = [
  'balls',
  'cones',
  'poles',
  'bibs',
  'goals',
  'mini-goals',
  'mannequins',
  'hurdles',
  'ladder',
  'markers',
  'wall',
  'bands',
] as const;
export type TrainingEquipment = (typeof TRAINING_EQUIPMENT)[number];

export const TRAINING_EQUIPMENT_LABELS: Record<TrainingEquipment, string> = {
  balls: 'Balls',
  cones: 'Cones',
  poles: 'Poles',
  bibs: 'Bibs',
  goals: 'Goals',
  'mini-goals': 'Mini goals',
  mannequins: 'Mannequins',
  hurdles: 'Hurdles',
  ladder: 'Agility ladder',
  markers: 'Flat markers',
  wall: 'Wall',
  bands: 'Resistance bands',
};

export function isTrainingEquipment(value: unknown): value is TrainingEquipment {
  return typeof value === 'string' && (TRAINING_EQUIPMENT as readonly string[]).includes(value);
}

/** Etiqueta de material tolerante: lo desconocido se muestra tal cual. */
export function trainingEquipmentLabel(value: string): string {
  return TRAINING_EQUIPMENT_LABELS[value as TrainingEquipment] ?? value;
}

/** Descanso legible: `90` → «1 min 30 s», `120` → «2 min», `45` → «45 s». */
export function trainingRestLabel(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  if (rest === 0) return `${minutes} min`;
  return `${minutes} min ${rest} s`;
}

/**
 * Resumen de la carga para la ficha: «4 × 4 min · rest 1 min 30 s». Lo que no
 * esté relleno simplemente no aparece, y sin nada devuelve `null` para poder
 * ocultar el bloque entero.
 */
export function trainingWorkloadLabel(input: {
  series?: number | null;
  reps?: string | null;
  restSeconds?: number | null;
}): string | null {
  const volume =
    input.series && input.reps
      ? `${input.series} × ${input.reps}`
      : input.series
        ? `${input.series} series`
        : (input.reps ?? null);
  const rest = trainingRestLabel(input.restSeconds);

  const parts = [volume, rest ? `rest ${rest}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// ---------------------------------------------------------------------------
// Sesiones (plan semanal)
// ---------------------------------------------------------------------------

/** Días de la semana de una sesión: 0 = lunes … 6 = domingo. */
export const TRAINING_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export const TRAINING_WEEKDAY_LABELS: Record<number, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};

/** Etiqueta del día; `null` si la sesión no tiene día asignado. */
export function trainingWeekdayLabel(weekday: number | null | undefined): string | null {
  if (weekday === null || weekday === undefined) return null;
  return TRAINING_WEEKDAY_LABELS[weekday] ?? null;
}

/** Opciones del desplegable de día (mismo orden que `TRAINING_WEEKDAYS`). */
export const TRAINING_WEEKDAY_OPTIONS: { value: string; label: string }[] = TRAINING_WEEKDAYS.map(
  (day) => ({ value: String(day), label: trainingWeekdayLabel(day) ?? '' })
);

export function isTrainingWeekday(value: unknown): value is number {
  return typeof value === 'number' && (TRAINING_WEEKDAYS as readonly number[]).includes(value);
}

// ---------------------------------------------------------------------------
// Programación
// ---------------------------------------------------------------------------

/** Margen mínimo para programar: evita fechas que ya pasaron por la latencia. */
export const TRAINING_SCHEDULE_MIN_LEAD_MINUTES = 5;
