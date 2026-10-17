import { describe, expect, it } from 'vitest';
import {
  FACTOR_CHIP_CLASSES,
  FACTOR_DOT_CLASSES,
  HEALTH_FACTORS,
  HEALTH_TONES,
  compoundGain,
  completionRatio,
  factorNeighbours,
  factorOfTheDay,
  formatGain,
  getHealthFactor,
  healthStorageKey,
  normalizeProgress,
  recentDayKeys,
  streakDays,
  toggleHabit,
  weekPlan,
} from '@/lib/health';

describe('THE "1%" FACTOR — contenido', () => {
  it('cada factor tiene slug único y todos los campos rellenos', () => {
    const slugs = HEALTH_FACTORS.map((factor) => factor.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const factor of HEALTH_FACTORS) {
      expect(factor.title).toBeTruthy();
      expect(factor.icon).toBeTruthy();
      expect(factor.tagline).toBeTruthy();
      expect(factor.quickAction.trim().length).toBeGreaterThan(10);
      expect(factor.summary).toBeTruthy();
      expect(factor.why).toBeTruthy();
      expect(factor.metric).toBeTruthy();
      expect(factor.habits.length).toBeGreaterThanOrEqual(3);
      for (const habit of factor.habits) {
        expect(habit.trim().length).toBeGreaterThan(10);
      }
      expect(HEALTH_TONES).toContain(factor.tone);
    }
  });

  it('cada factor enlaza compañeros que existen y nunca a sí mismo', () => {
    const slugs = new Set(HEALTH_FACTORS.map((factor) => factor.slug));
    for (const factor of HEALTH_FACTORS) {
      expect(factor.related.length).toBeGreaterThan(0);
      for (const related of factor.related) {
        expect(slugs.has(related)).toBe(true);
        expect(related).not.toBe(factor.slug);
      }
    }
  });

  it('incluye los factores clave del hub', () => {
    const slugs = HEALTH_FACTORS.map((factor) => factor.slug);
    for (const expected of ['sleep', 'hydration', 'fuel', 'recovery', 'mind', 'consistency']) {
      expect(slugs).toContain(expected);
    }
  });

  it('los hábitos no se repiten dentro de un mismo factor', () => {
    for (const factor of HEALTH_FACTORS) {
      expect(new Set(factor.habits).size).toBe(factor.habits.length);
    }
  });

  it('cada tono tiene chip y punto de color', () => {
    for (const tone of HEALTH_TONES) {
      expect(FACTOR_CHIP_CLASSES[tone]).toBeTruthy();
      expect(FACTOR_DOT_CLASSES[tone]).toBeTruthy();
    }
  });
});

describe('navegación entre factores', () => {
  it('getHealthFactor resuelve por slug', () => {
    expect(getHealthFactor('sleep')?.title).toBe('Sleep');
    expect(getHealthFactor('nope')).toBeUndefined();
  });

  it('factorNeighbours da anterior y siguiente, y respeta los extremos', () => {
    const first = HEALTH_FACTORS[0]!;
    const second = HEALTH_FACTORS[1]!;
    const last = HEALTH_FACTORS[HEALTH_FACTORS.length - 1]!;

    expect(factorNeighbours(first.slug).previous).toBeNull();
    expect(factorNeighbours(first.slug).next?.slug).toBe(second.slug);
    expect(factorNeighbours(last.slug).next).toBeNull();
    expect(factorNeighbours(last.slug).previous).not.toBeNull();
    expect(factorNeighbours('nope')).toEqual({ previous: null, next: null });
  });
});

describe('el 1% compuesto', () => {
  it('un 1% mejor cada día durante un año es ×37.8', () => {
    expect(formatGain(compoundGain(1, 365))).toBe('37.8×');
  });

  it('un 1% peor cada día deja casi nada', () => {
    expect(formatGain(compoundGain(-1, 365))).toBe('0.03×');
  });

  it('sin cambio no hay ganancia', () => {
    expect(compoundGain(0, 365)).toBe(1);
    expect(formatGain(1)).toBe('1.00×');
  });
});

describe('factor del día y ritmo semanal', () => {
  it('el factor del día es determinista dentro del mismo día y rota al siguiente', () => {
    const morning = factorOfTheDay(HEALTH_FACTORS, new Date('2026-10-16T06:00:00Z'));
    const night = factorOfTheDay(HEALTH_FACTORS, new Date('2026-10-16T22:00:00Z'));
    const tomorrow = factorOfTheDay(HEALTH_FACTORS, new Date('2026-10-17T06:00:00Z'));

    expect(morning?.slug).toBe(night?.slug);
    expect(morning?.slug).not.toBe(tomorrow?.slug);
    expect(factorOfTheDay([], new Date('2026-10-16T06:00:00Z'))).toBeNull();
  });

  it('el ritmo semanal reparte los factores por los siete días', () => {
    const plan = weekPlan(HEALTH_FACTORS);
    expect(plan).toHaveLength(7);
    expect(plan[0]?.label).toBe('Mon');
    expect(plan[0]?.weekday).toBe(0);
    expect(plan[0]?.factor.slug).toBe(HEALTH_FACTORS[0]?.slug);
    expect(plan[6]?.label).toBe('Sun');
    expect(plan[6]?.factor.slug).toBe(HEALTH_FACTORS[6]?.slug);
    expect(weekPlan([])).toHaveLength(0);
  });
});

describe('progreso local', () => {
  const now = new Date('2026-10-16T12:00:00Z');

  it('recentDayKeys devuelve los últimos días, del más antiguo al más reciente', () => {
    expect(recentDayKeys(3, now)).toEqual(['2026-10-14', '2026-10-15', '2026-10-16']);
    expect(recentDayKeys(0, now)).toEqual([]);
  });

  it('completionRatio acota entre 0 y 1 y tolera total 0', () => {
    expect(completionRatio(2, 4)).toBe(0.5);
    expect(completionRatio(9, 4)).toBe(1);
    expect(completionRatio(0, 0)).toBe(0);
  });

  it('streakDays cuenta días seguidos y mantiene viva la racha de ayer', () => {
    expect(streakDays(['2026-10-16', '2026-10-15', '2026-10-14'], now)).toBe(3);
    // Hoy todavía sin marcar, pero ayer sí: la racha sigue viva.
    expect(streakDays(['2026-10-15', '2026-10-14'], now)).toBe(2);
    // Con un hueco, solo cuenta la parte más reciente.
    expect(streakDays(['2026-10-16', '2026-10-13'], now)).toBe(1);
    expect(streakDays([], now)).toBe(0);
  });

  it('normalizeProgress sanea basura y vacía los hábitos al cambiar de día', () => {
    const raw = {
      day: '2026-10-15',
      habits: [0, 0, 'x', -1, 2],
      days: ['2026-10-15', 'nope', '2026-10-15'],
    };

    const sameDay = normalizeProgress(raw, '2026-10-15');
    expect(sameDay.habits).toEqual([0, 2]);
    expect(sameDay.days).toEqual(['2026-10-15']);

    const otherDay = normalizeProgress(raw, '2026-10-16');
    expect(otherDay.day).toBe('2026-10-16');
    expect(otherDay.habits).toEqual([]);

    expect(normalizeProgress(null, '2026-10-16')).toEqual({
      day: '2026-10-16',
      habits: [],
      days: [],
    });
  });

  it('toggleHabit marca, completa el día y lo quita al desmarcar', () => {
    const empty = { day: '2026-10-16', habits: [], days: [] };

    const half = toggleHabit(empty, 0, 2, '2026-10-16');
    expect(half.habits).toEqual([0]);
    expect(half.days).toEqual([]); // a medias no cuenta como día

    const complete = toggleHabit(half, 1, 2, '2026-10-16');
    expect(complete.habits).toEqual([0, 1]);
    expect(complete.days).toEqual(['2026-10-16']);

    const back = toggleHabit(complete, 1, 2, '2026-10-16');
    expect(back.habits).toEqual([0]);
    expect(back.days).toEqual([]);
  });

  it('la clave de almacenamiento es propia de cada factor', () => {
    expect(healthStorageKey('sleep')).toContain('sleep');
    expect(healthStorageKey('sleep')).not.toBe(healthStorageKey('mind'));
  });
});
