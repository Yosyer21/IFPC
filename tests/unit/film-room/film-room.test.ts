import { describe, expect, it } from 'vitest';
import {
  FILM_CLIP_CATEGORY_LABELS,
  FILM_CLIP_STATUS_LABELS,
  formatTimestamp,
  parseTimestamp,
} from '../../../apps/web/lib/film-room';

describe('Film Room helpers', () => {
  it('convierte marcas de tiempo a segundos', () => {
    expect(parseTimestamp('')).toBe(0);
    expect(parseTimestamp('7')).toBe(7);
    expect(parseTimestamp('1:05')).toBe(65);
    expect(parseTimestamp('1:00:05')).toBe(3605);
    expect(parseTimestamp('bad')).toBeNull();
    expect(parseTimestamp('-1:00')).toBeNull();
  });

  it('formatea segundos como mm:ss', () => {
    expect(formatTimestamp(0)).toBe('0:00');
    expect(formatTimestamp(65)).toBe('1:05');
    expect(formatTimestamp(-4)).toBe('0:00');
  });

  it('expone etiquetas legibles', () => {
    expect(FILM_CLIP_CATEGORY_LABELS.ON_THE_BALL).toBe('On the Ball');
    expect(FILM_CLIP_STATUS_LABELS.PENDING).toBe('Waiting for feedback');
    expect(FILM_CLIP_STATUS_LABELS.REVIEWED).toBe('Coach replied');
  });
});
