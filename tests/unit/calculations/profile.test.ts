import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE_ACCENT,
  PROFILE_ACCENTS,
  PROFILE_ACCENT_PALETTE,
  PROFILE_CHECKLIST,
  PROFILE_CHECKLIST_KEYS,
  PROFILE_CHECKLIST_POINTS,
  PROFILE_OPEN_TO_MAX,
  profileAccentColors,
  profileChecklistScore,
  profileOpenToLabels,
  resolveProfileAccent,
  sanitizeProfileOpenTo,
} from '@ifpc/config';
import { playerProfileChecklist } from '@/lib/player';

describe('profileChecklistScore', () => {
  it('los pesos suman 100 y las claves siguen el orden declarado', () => {
    expect(PROFILE_CHECKLIST_POINTS).toBe(100);
    expect(PROFILE_CHECKLIST.map((item) => item.key)).toEqual([...PROFILE_CHECKLIST_KEYS]);
    expect(new Set(PROFILE_CHECKLIST_KEYS).size).toBe(PROFILE_CHECKLIST_KEYS.length);
  });

  it('sin datos marca 0% y propone el pendiente de más peso', () => {
    const state = profileChecklistScore();
    expect(state.percent).toBe(0);
    expect(state.completed).toBe(0);
    expect(state.points).toBe(0);
    expect(state.total).toBe(PROFILE_CHECKLIST.length);
    // `position` y `physicalData` pesan 10: gana el primero declarado.
    expect(state.next?.key).toBe('position');
  });

  it('con todo completado llega al 100% y no propone nada', () => {
    const done = Object.fromEntries(PROFILE_CHECKLIST_KEYS.map((key) => [key, true]));
    const state = profileChecklistScore(done);
    expect(state.percent).toBe(100);
    expect(state.completed).toBe(state.total);
    expect(state.points).toBe(PROFILE_CHECKLIST_POINTS);
    expect(state.next).toBeNull();
  });

  it('pondera por peso, no por número de campos', () => {
    const state = profileChecklistScore({ position: true, physicalData: true });
    expect(state.points).toBe(20);
    expect(state.percent).toBe(20);
    expect(state.completed).toBe(2);
    // Lo pendiente de más peso es la foto (10), el primero de los 10 puntos.
    expect(state.next?.key).toBe('photo');
  });

  it('solo cuenta lo estrictamente verdadero', () => {
    const state = profileChecklistScore({ position: false, bio: undefined });
    expect(state.completed).toBe(0);
    expect(state.percent).toBe(0);
  });
});

describe('profile accent', () => {
  it('resuelve el acento guardado y cae al de marca', () => {
    expect(resolveProfileAccent('violet')).toBe('violet');
    expect(resolveProfileAccent('neon')).toBe(DEFAULT_PROFILE_ACCENT);
    expect(resolveProfileAccent(null)).toBe(DEFAULT_PROFILE_ACCENT);
    expect(resolveProfileAccent(undefined)).toBe(DEFAULT_PROFILE_ACCENT);
  });

  it('devuelve colores válidos para toda la paleta', () => {
    for (const accent of PROFILE_ACCENTS) {
      const colors = profileAccentColors(accent);
      expect(colors).toEqual(PROFILE_ACCENT_PALETTE[accent]);
      expect(colors.hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(colors.soft).toMatch(/^rgba\(/);
    }
  });

  it('un acento desconocido devuelve los colores por defecto', () => {
    expect(profileAccentColors('neon')).toEqual(PROFILE_ACCENT_PALETTE[DEFAULT_PROFILE_ACCENT]);
  });
});

describe('sanitizeProfileOpenTo', () => {
  it('conserva solo lo conocido y sin duplicados', () => {
    expect(sanitizeProfileOpenTo(['CLUB', 'CLUB', 'NOPE', 'AGENT'])).toEqual(['CLUB', 'AGENT']);
  });

  it('corta al máximo permitido', () => {
    const all = ['CLUB', 'TRIAL', 'SCHOLARSHIP', 'COLLEGE', 'AGENT'];
    expect(sanitizeProfileOpenTo(all)).toEqual(['CLUB', 'TRIAL', 'SCHOLARSHIP']);
    expect(sanitizeProfileOpenTo(all)).toHaveLength(PROFILE_OPEN_TO_MAX);
  });

  it('acepta basura sin lanzar', () => {
    expect(sanitizeProfileOpenTo([])).toEqual([]);
    expect(sanitizeProfileOpenTo(['', null, 3, {}])).toEqual([]);
  });
});

describe('profileOpenToLabels', () => {
  it('traduce las señales y descarta lo desconocido', () => {
    expect(profileOpenToLabels(['CLUB', 'NOPE'])).toEqual(['Looking for a club']);
    expect(profileOpenToLabels([])).toEqual([]);
  });
});

describe('playerProfileChecklist', () => {
  const base = {
    firstName: 'Ana',
    lastName: 'García',
    dateOfBirth: new Date('2010-05-04'),
    nationality: 'Spain',
    position: 'MIDFIELDER',
    foot: 'LEFT',
    competitionLevel: 'REGIONAL',
    heightCm: 170,
    weightKg: 60,
    clubName: 'CD Demo',
    bio: 'Left-footed central midfielder who arrives in the box',
    headline: 'Left-footed central midfielder who arrives in the box',
    bannerUrl: '/uploads/banners/a.jpg',
    image: '/uploads/photos/a.jpg',
    careerCount: 2,
  };

  it('con los datos completos llega al 100%', () => {
    const state = playerProfileChecklist(base);
    expect(state.percent).toBe(100);
    expect(state.completed).toBe(state.total);
    expect(state.next).toBeNull();
  });

  it('los datos físicos cuentan solo si están los dos', () => {
    const missingOne = playerProfileChecklist({ ...base, weightKg: null });
    expect(missingOne.items.find((item) => item.key === 'physicalData')?.done).toBe(false);

    const complete = playerProfileChecklist(base);
    expect(complete.items.find((item) => item.key === 'physicalData')?.done).toBe(true);
  });

  it('resta lo que falta: foto y trayectoria', () => {
    const state = playerProfileChecklist({ ...base, image: null, careerCount: 0 });
    // Foto (10) + trayectoria (6) son los puntos que faltan.
    expect(state.points).toBe(84);
    expect(state.percent).toBe(84);
    expect(state.items.filter((item) => !item.done).map((item) => item.key)).toEqual([
      'photo',
      'career',
    ]);
  });

  it('el siguiente paso es el pendiente de más peso', () => {
    const state = playerProfileChecklist({ ...base, position: null, image: null });
    // `position` (10) pesa más que la foto (8).
    expect(state.next?.key).toBe('position');
  });
});
