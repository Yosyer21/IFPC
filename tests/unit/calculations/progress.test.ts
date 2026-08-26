import { describe, expect, it } from 'vitest';
import { profileCompletionPercentage } from '@ifpc/config';

describe('profileCompletionPercentage', () => {
  it('returns 100% when all fields are complete', () => {
    expect(profileCompletionPercentage(['Ana', 'García', 'DEL', 178])).toBe(100);
  });

  it('returns 50% when half of the fields are complete', () => {
    expect(profileCompletionPercentage(['Ana', null, 'DEL', null])).toBe(50);
  });

  it('treats falsy values as empty', () => {
    expect(profileCompletionPercentage(['Ana', '', 0, null])).toBe(25);
  });

  it('returns 0 with an empty list', () => {
    expect(profileCompletionPercentage([])).toBe(0);
  });
});
