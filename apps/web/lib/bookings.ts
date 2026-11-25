/**
 * The "1%" Factor — reglas puras de reservas (sin Prisma), compartidas por la UI
 * y las server actions. Precios y etiquetas según el libro (sección 4.11).
 */

export const BOOKING_SESSION_TYPES = ['INTRO', 'FULL', 'PACKAGE'] as const;
export type BookingSessionTypeValue = (typeof BOOKING_SESSION_TYPES)[number];

export const BOOKING_SESSION_LABELS: Record<BookingSessionTypeValue, string> = {
  INTRO: 'Intro · 30 min',
  FULL: 'Full · 60 min',
  PACKAGE: 'Package · 4 × 60 min',
};

export const BOOKING_SESSION_MINUTES: Record<BookingSessionTypeValue, number> = {
  INTRO: 30,
  FULL: 60,
  PACKAGE: 240,
};

/**
 * Precio de una sesión a partir del precio "desde" del especialista:
 * - INTRO = 60 % del precio completo
 * - FULL = precio completo
 * - PACKAGE = 4 × precio completo − 20
 */
export function priceForSession(fullPrice: number, type: BookingSessionTypeValue): number {
  const base = Math.max(0, Math.round(fullPrice));
  if (type === 'INTRO') return Math.round(base * 0.6);
  if (type === 'PACKAGE') return Math.max(0, base * 4 - 20);
  return base;
}

export const BOOKING_STATUSES = [
  'AWAITING_PARENT',
  'AWAITING_SPECIALIST',
  'CONFIRMED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
] as const;
export type BookingStatusValue = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatusValue, string> = {
  AWAITING_PARENT: 'Awaiting parent',
  AWAITING_SPECIALIST: 'Parent approved & paid',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};
