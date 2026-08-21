import { describe, expect, it } from 'vitest';
import { calculateAge, matchScore } from './engine';

describe('calculateAge', () => {
  it('calcula la edad correctamente', () => {
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
    nationality: 'España',
    competitionLevel: 'nacional',
    status: 'AVAILABLE',
  };

  it('da 100 con todos los criterios alineados', () => {
    const result = matchScore(player, {
      position: 'DEL',
      ageMin: 15,
      ageMax: 17,
      level: 'nacional',
      country: 'España',
    });
    expect(result.total).toBe(100);
    expect(result.criteria).toHaveLength(5);
    expect(result.summary).toBe('Muy buena coincidencia');
  });

  it('penaliza la posición no coincidente', () => {
    const result = matchScore(player, { position: 'DEF' });
    expect(result.total).toBeLessThan(100);
    const position = result.criteria.find((criterion) => criterion.key === 'position');
    expect(position?.score).toBe(0);
  });

  it('edad fuera de rango penaliza', () => {
    const result = matchScore(player, { ageMin: 10, ageMax: 12 });
    const age = result.criteria.find((criterion) => criterion.key === 'age');
    expect(age?.score).toBe(0);
  });

  it('sin restricciones mantiene peso neutro', () => {
    const result = matchScore(player, {});
    expect(result.total).toBe(100);
  });

  it('jugador no disponible pierde puntos de disponibilidad', () => {
    const result = matchScore({ ...player, status: 'INACTIVE' }, {});
    const availability = result.criteria.find((criterion) => criterion.key === 'availability');
    expect(availability?.score).toBe(0);
  });
});
