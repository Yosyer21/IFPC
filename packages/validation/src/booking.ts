import { z } from 'zod';

/** Solicitud de reserva en The "1%" Factor. */
export const BOOKING_SESSION_TYPES = ['INTRO', 'FULL', 'PACKAGE'] as const;

export const bookingRequestSchema = z.object({
  healthAgentId: z.string().min(1),
  sessionType: z.enum(BOOKING_SESSION_TYPES),
  /** Slot de disponibilidad publicado por el especialista. */
  slotId: z.string().min(1),
  notes: z.string().trim().max(500).optional().nullable(),
  /** Solo lo usa el padre cuando reserva para un hijo concreto. */
  playerId: z.string().min(1).optional(),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
