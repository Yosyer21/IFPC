import { describe, expect, it } from 'vitest';
import { affinityScore } from './affinity';

const birthYear = new Date().getUTCFullYear() - 16;

const player = {
  position: 'DEL',
  dateOfBirth: new Date(Date.UTC(birthYear, 0, 15)),
  nationality: 'Spain',
  location: 'Madrid',
  clubName: 'Madrid Academy',
  competitionLevel: 'nacional',
  appearances: 25,
  goalContributions: 12,
  highlights: 4,
};

function criterion(result: ReturnType<typeof affinityScore>, key: string) {
  return result.criteria.find((entry) => entry.key === key);
}

describe('affinityScore', () => {
  it('gives 100 with every criterion aligned', () => {
    const result = affinityScore(player, {
      kind: 'club',
      name: 'Demo Club',
      country: 'Spain',
      city: 'Madrid',
      positions: ['DEL'],
      ageMin: 16,
      ageMax: 18,
      levels: ['nacional'],
    });
    expect(result.total).toBe(100);
    expect(result.criteria).toHaveLength(5);
    expect(result.summary).toBe('Strong affinity');
    expect(result.kind).toBe('club');
  });

  it('penalises a position with no open need', () => {
    const result = affinityScore(player, { kind: 'club', positions: ['DEF'] });
    expect(criterion(result, 'position')?.score).toBe(0);
    expect(result.total).toBe(70);
  });

  it('gives neutral activity points when stats are hidden', () => {
    const result = affinityScore(
      { ...player, appearances: null, goalContributions: null, highlights: null },
      { kind: 'school' }
    );
    expect(criterion(result, 'activity')?.score).toBe(8);
    expect(result.total).toBe(93);
  });

  it('gives partial age points near the range', () => {
    const result = affinityScore(player, { kind: 'club', ageMin: 18, ageMax: 20 });
    expect(criterion(result, 'age')?.score).toBe(13);
  });

  it('penalises a different location', () => {
    const result = affinityScore(player, {
      kind: 'university',
      country: 'Germany',
      city: 'Berlin',
    });
    expect(criterion(result, 'geography')?.score).toBe(0);
  });

  it('keeps neutral weights when the destination has no needs', () => {
    const result = affinityScore(player, { kind: 'university' });
    expect(result.total).toBe(100);
    expect(result.summary).toBe('Strong affinity');
  });
});
