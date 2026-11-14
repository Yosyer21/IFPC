import { describe, expect, it } from 'vitest';
import {
  ageGroupLabel,
  ageOn,
  matchesScoutingFilters,
  parseScoutingFilters,
  positionGroup,
  positionLabel,
  scoutingAgeGroup,
  scoutingHref,
} from '@/lib/club-scouting';

const NOW = new Date('2026-06-15T12:00:00.000Z');

function born(yearsAgo: number, month = 1, day = 10): Date {
  return new Date(Date.UTC(2026 - yearsAgo, month - 1, day));
}

describe('positionGroup', () => {
  it('agrupa las posiciones del modelo en cuatro familias', () => {
    expect(positionGroup('POR')).toBe('keepers');
    expect(positionGroup('DEF')).toBe('defenders');
    expect(positionGroup('LAT')).toBe('defenders');
    expect(positionGroup('CAR')).toBe('defenders');
    expect(positionGroup('MED')).toBe('midfield');
    expect(positionGroup('PIV')).toBe('midfield');
    expect(positionGroup('EXT')).toBe('forwards');
    expect(positionGroup('DEL')).toBe('forwards');
  });

  it('devuelve null si no hay posición o no se conoce', () => {
    expect(positionGroup(null)).toBeNull();
    expect(positionGroup('XYZ')).toBeNull();
  });
});

describe('positionLabel', () => {
  it('traduce las posiciones conocidas y deja pasar el resto', () => {
    expect(positionLabel('POR')).toBe('Goalkeeper');
    expect(positionLabel('DEL')).toBe('Striker');
    expect(positionLabel('XYZ')).toBe('XYZ');
    expect(positionLabel(null)).toBe('Position TBD');
  });
});

describe('ageOn', () => {
  it('cuenta la edad cumplida y respeta el día del cumpleaños', () => {
    expect(ageOn(born(17), NOW)).toBe(17);
    expect(ageOn(new Date(Date.UTC(2009, 5, 15)), NOW)).toBe(17);
    expect(ageOn(new Date(Date.UTC(2009, 5, 16)), NOW)).toBe(16);
    expect(ageOn(null, NOW)).toBeNull();
  });
});

describe('scoutingAgeGroup', () => {
  it('reparte las edades en U14, U16, U17 y U19+', () => {
    expect(scoutingAgeGroup(13)).toBe('u14');
    expect(scoutingAgeGroup(14)).toBe('u14');
    expect(scoutingAgeGroup(15)).toBe('u16');
    expect(scoutingAgeGroup(16)).toBe('u16');
    expect(scoutingAgeGroup(17)).toBe('u17');
    expect(scoutingAgeGroup(18)).toBe('u19');
    expect(scoutingAgeGroup(22)).toBe('u19');
    expect(scoutingAgeGroup(null)).toBeNull();
  });

  it('etiqueta las categorías', () => {
    expect(ageGroupLabel('u14')).toBe('U14');
    expect(ageGroupLabel('u19')).toBe('U19+');
  });
});

describe('parseScoutingFilters', () => {
  it('acepta valores válidos y cae en All con basura', () => {
    expect(parseScoutingFilters({ position: 'keepers', age: 'u16' })).toEqual({
      position: 'keepers',
      age: 'u16',
    });
    expect(parseScoutingFilters({ position: 'nope', age: 'u99' })).toEqual({
      position: 'all',
      age: 'all',
    });
    expect(parseScoutingFilters({})).toEqual({ position: 'all', age: 'all' });
  });
});

describe('matchesScoutingFilters', () => {
  const keeper = { position: 'POR', dateOfBirth: born(14) };
  const striker = { position: 'DEL', dateOfBirth: born(17) };

  it('sin filtros entra todo el mundo', () => {
    const filters = { position: 'all', age: 'all' } as const;
    expect(matchesScoutingFilters(keeper, filters, NOW)).toBe(true);
    expect(matchesScoutingFilters(striker, filters, NOW)).toBe(true);
  });

  it('aplica posición y edad a la vez', () => {
    expect(matchesScoutingFilters(keeper, { position: 'keepers', age: 'all' }, NOW)).toBe(true);
    expect(matchesScoutingFilters(striker, { position: 'keepers', age: 'all' }, NOW)).toBe(false);
    expect(matchesScoutingFilters(striker, { position: 'all', age: 'u17' }, NOW)).toBe(true);
    expect(matchesScoutingFilters(keeper, { position: 'all', age: 'u17' }, NOW)).toBe(false);
  });
});

describe('scoutingHref', () => {
  it('conserva solo los filtros activos', () => {
    expect(scoutingHref('/dashboard/club/players', { position: 'all', age: 'all' })).toBe(
      '/dashboard/club/players'
    );
    expect(scoutingHref('/dashboard/club/players', { position: 'forwards', age: 'all' })).toBe(
      '/dashboard/club/players?position=forwards'
    );
    expect(scoutingHref('/dashboard/club/players', { position: 'forwards', age: 'u16' })).toBe(
      '/dashboard/club/players?position=forwards&age=u16'
    );
  });
});
