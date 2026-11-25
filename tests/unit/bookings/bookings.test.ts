import { describe, expect, it } from 'vitest';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_SESSION_LABELS,
  priceForSession,
} from '../../../apps/web/lib/bookings';

describe('The "1%" Factor booking rules', () => {
  it('calcula el precio por tipo de sesión', () => {
    expect(priceForSession(60, 'FULL')).toBe(60);
    expect(priceForSession(60, 'INTRO')).toBe(36); // 60 %
    expect(priceForSession(60, 'PACKAGE')).toBe(220); // 4 × 60 − 20
    expect(priceForSession(0, 'PACKAGE')).toBe(0); // nunca negativo
    expect(priceForSession(70.4, 'FULL')).toBe(70); // redondeo
  });

  it('expone etiquetas legibles', () => {
    expect(BOOKING_SESSION_LABELS.FULL).toContain('60');
    expect(priceForSession(50, 'INTRO')).toBe(30);
    expect(BOOKING_STATUS_LABELS.AWAITING_PARENT).toBe('Awaiting parent');
    expect(BOOKING_STATUS_LABELS.AWAITING_SPECIALIST).toBe('Parent approved & paid');
    expect(BOOKING_STATUS_LABELS.CONFIRMED).toBe('Confirmed');
  });
});
