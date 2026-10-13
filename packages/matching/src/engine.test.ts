import { describe, expect, it } from 'vitest';
import { calculateAge, matchScore } from './engine';

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    const birth = new Date('2010-03-10');
    const age = calculateAge(birth);
    expect(age).toBeGreaterThanOrEqual(15);
    expect(age).toBeLessThanOrEqual(18);
  });
});

describe('matchScore', () => {
  const player = {
    position: 'DEL',
    dateOfBirth: new Date('2010-03-10'),
    nationality: 'Spain',
    competitionLevel: 'nacional',
    status: 'AVAILABLE',
  };

  it('gives 100 with all criteria aligned', () => {
    const result = matchScore(player, {
      position: 'DEL',
      ageMin: 15,
      ageMax: 17,
      level: 'nacional',
      country: 'Spain',
    });
    expect(result.total).toBe(100);
    expect(result.criteria).toHaveLength(5);
    expect(result.summary).toBe('Very good match');
  });

  it('penalizes the non-matching position', () => {
    const result = matchScore(player, { position: 'DEF' });
    expect(result.total).toBeLessThan(100);
    const position = result.criteria.find((criterion) => criterion.key === 'position');
    expect(position?.score).toBe(0);
  });

  it('age outside the range is penalised', () => {
    const result = matchScore(player, { ageMin: 10, ageMax: 12 });
    const age = result.criteria.find((criterion) => criterion.key === 'age');
    expect(age?.score).toBe(0);
  });

  it('with no restrictions keeps a neutral weight', () => {
    const result = matchScore(player, {});
    expect(result.total).toBe(100);
  });

  it('unavailable player loses availability points', () => {
    const result = matchScore({ ...player, status: 'INACTIVE' }, {});
    const availability = result.criteria.find((criterion) => criterion.key === 'availability');
    expect(availability?.score).toBe(0);
  });
});
