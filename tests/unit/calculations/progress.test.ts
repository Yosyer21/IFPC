import { describe, expect, it } from 'vitest';
import { profileCompletionPercentage } from '@ifpc/config';

describe('profileCompletionPercentage', () => {
  it('devuelve 100% cuando todos los campos están completos', () => {
    expect(profileCompletionPercentage(['Ana', 'García', 'DEL', 178])).toBe(100);
  });

  it('devuelve 50% cuando la mitad de los campos está completa', () => {
    expect(profileCompletionPercentage(['Ana', null, 'DEL', null])).toBe(50);
  });

  it('trata los valores falsy como vacíos', () => {
    expect(profileCompletionPercentage(['Ana', '', 0, null])).toBe(25);
  });

  it('devuelve 0 con una lista vacía', () => {
    expect(profileCompletionPercentage([])).toBe(0);
  });
});
