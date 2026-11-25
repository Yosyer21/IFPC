import { describe, expect, it } from 'vitest';
import { averageRating } from '../../../apps/web/lib/reviews';

describe('averageRating', () => {
  it('calcula la media con un decimal', () => {
    expect(averageRating([5, 4])).toBe(4.5);
    expect(averageRating([5, 5, 4])).toBe(4.7);
    expect(averageRating([1])).toBe(1);
  });

  it('ignora valores fuera de rango y devuelve null sin datos', () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating([0, 6, Number.NaN])).toBeNull();
    expect(averageRating([0, 6, 4])).toBe(4);
  });
});
