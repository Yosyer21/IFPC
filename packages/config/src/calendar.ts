/**
 * Calendario del sistema: tipos de evento, etiquetas y días de la semana.
 *
 * El calendario **no crea** datos: agrega lo que ya existe repartido por la
 * plataforma (clases en vivo, salas de vídeo, pruebas, campamentos, cierres de
 * convocatorias y el desarrollo del jugador). Aquí vive la única fuente de
 * verdad de qué tipos existen y cómo se llaman, para que la página, la leyenda y
 * los tests no repitan literales.
 */

/** Tipos de evento que puede pintar el calendario. */
export const CALENDAR_EVENT_KINDS = [
  'live',
  'room',
  'trial',
  'camp',
  'deadline',
  'pathway',
  'goal',
] as const;

export type CalendarEventKind = (typeof CALENDAR_EVENT_KINDS)[number];

export const CALENDAR_EVENT_LABELS: Record<CalendarEventKind, string> = {
  live: 'Live session',
  room: 'Video room',
  trial: 'Trial',
  camp: 'Camp',
  deadline: 'Deadline',
  pathway: 'Pathway',
  goal: 'Goal',
};

export function isCalendarEventKind(value: unknown): value is CalendarEventKind {
  return typeof value === 'string' && (CALENDAR_EVENT_KINDS as readonly string[]).includes(value);
}

/**
 * Cabeceras de la rejilla, de **lunes a domingo** (la semana europea). El índice
 * 0 es lunes, igual que `TRAINING_WEEKDAYS` (0 = lunes … 6 = domingo).
 */
export const CALENDAR_WEEKDAY_LABELS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const;
