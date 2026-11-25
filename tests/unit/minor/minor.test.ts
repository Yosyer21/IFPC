import { describe, expect, it } from 'vitest';
import {
  ageOn,
  canShowStatsAndClips,
  isMinor,
  isUnder16,
  isVisibleToClubs,
  isVisibleToSchools,
  needsParentApproval,
} from '../../../apps/web/lib/minor';

const NOW = new Date('2026-06-15T12:00:00Z');

const allow = {
  idVisibleToClubs: true,
  idVisibleToSchools: true,
  showStatsAndClips: true,
};
const deny = {
  idVisibleToClubs: false,
  idVisibleToSchools: false,
  showStatsAndClips: false,
};

describe('minor protection helpers', () => {
  it('calcula la edad cumplida en UTC', () => {
    expect(ageOn(new Date('2010-06-15'), NOW)).toBe(16);
    expect(ageOn(new Date('2010-06-16'), NOW)).toBe(15);
    expect(ageOn(null, NOW)).toBeNull();
  });

  it('detecta menores de 16 en el límite exacto', () => {
    expect(isUnder16(new Date('2010-06-16'), NOW)).toBe(true);
    expect(isUnder16(new Date('2010-06-15'), NOW)).toBe(false);
    expect(isUnder16(null, NOW)).toBe(false);
  });

  it('detecta menores de edad (<18)', () => {
    expect(isMinor(new Date('2009-01-01'), NOW)).toBe(true);
    expect(isMinor(new Date('2008-06-15'), NOW)).toBe(false);
  });

  it('respeta la visibilidad del ID para clubes y colegios', () => {
    const minorDob = new Date('2012-01-01');
    expect(isVisibleToClubs(minorDob, [deny], NOW)).toBe(false);
    expect(isVisibleToClubs(minorDob, [deny, allow], NOW)).toBe(true);
    expect(isVisibleToSchools(minorDob, [deny], NOW)).toBe(false);
    // Los adultos no se ven afectados por los interruptores.
    expect(isVisibleToClubs(new Date('2000-01-01'), [deny], NOW)).toBe(true);
    // Sin vínculo parental no se bloquea.
    expect(isVisibleToClubs(minorDob, [], NOW)).toBe(true);
  });

  it('respeta mostrar estadísticas y clips', () => {
    const minorDob = new Date('2012-01-01');
    expect(canShowStatsAndClips(minorDob, [deny], NOW)).toBe(false);
    expect(canShowStatsAndClips(minorDob, [allow], NOW)).toBe(true);
    expect(canShowStatsAndClips(new Date('2000-01-01'), [deny], NOW)).toBe(true);
  });

  it('exige aprobación del padre solo a menores de 16 con vínculo', () => {
    const minorDob = new Date('2012-01-01');
    const adultDob = new Date('2000-01-01');
    expect(needsParentApproval(minorDob, [{ parentId: 'p1' }], NOW)).toBe(true);
    expect(needsParentApproval(minorDob, [], NOW)).toBe(false);
    expect(needsParentApproval(adultDob, [{ parentId: 'p1' }], NOW)).toBe(false);
    expect(needsParentApproval(null, [{ parentId: 'p1' }], NOW)).toBe(false);
  });
});
