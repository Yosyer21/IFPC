import { describe, expect, it } from 'vitest';
import {
  canonicalEvaluationCategory,
  daysUntil,
  developmentScore,
  developmentTimeline,
  evaluationCategoryLabel,
  evaluationSummary,
  evaluationTrend,
  goalStats,
  planCategoryNormalization,
} from '@/lib/player-development';

const NOW = new Date('2026-06-15T12:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe('evaluationSummary', () => {
  it('sin evaluaciones devuelve todo vacío', () => {
    const summary = evaluationSummary([]);
    expect(summary.count).toBe(0);
    expect(summary.overall).toBeNull();
    expect(summary.byCategory).toEqual([]);
    expect(summary.strongest).toBeNull();
    expect(summary.weakest).toBeNull();
  });

  it('calcula media global, por área y las áreas extremas', () => {
    const summary = evaluationSummary([
      { category: 'technical', score: 8 },
      { category: 'technical', score: 6 },
      { category: 'physical', score: 5 },
      { category: 'psychological', score: 9 },
    ]);
    expect(summary.count).toBe(4);
    expect(summary.overall).toBe(7);
    expect(summary.byCategory.map((item) => item.label)).toEqual([
      'Psychological',
      'Technique',
      'Physical',
    ]);
    expect(summary.strongest?.label).toBe('Psychological');
    expect(summary.weakest?.label).toBe('Physical');
    expect(summary.byCategory[1]).toMatchObject({ value: 7, count: 2 });
  });

  it('con una sola área no hay área floja', () => {
    const summary = evaluationSummary([{ category: 'tactical', score: 7 }]);
    expect(summary.strongest?.label).toBe('Tactics');
    expect(summary.weakest).toBeNull();
  });

  it('mantiene las áreas desconocidas con su valor crudo', () => {
    expect(evaluationSummary([{ category: 'mental', score: 4 }]).byCategory[0].label).toBe(
      'mental'
    );
  });

  it('une los datos heredados en español con su área canónica', () => {
    const summary = evaluationSummary([
      { category: 'technical', score: 8 },
      { category: 'Técnica', score: 6 },
      { category: 'psicológica', score: 9 },
      { category: 'PSICOLOGICO', score: 7 },
    ]);
    expect(summary.byCategory.map((area) => area.label)).toEqual(['Psychological', 'Technique']);
    expect(summary.byCategory[0]).toMatchObject({ value: 8, count: 2 });
    expect(summary.byCategory[1]).toMatchObject({ value: 7, count: 2 });
  });
});

describe('evaluationCategoryLabel', () => {
  it('traduce los valores canónicos y los heredados en español', () => {
    expect(canonicalEvaluationCategory('technical')).toBe('technical');
    expect(canonicalEvaluationCategory('TÁCTICA')).toBe('tactical');
    expect(canonicalEvaluationCategory('Física')).toBe('physical');
    expect(canonicalEvaluationCategory('psicologia')).toBe('psychological');
    expect(canonicalEvaluationCategory('raro')).toBeNull();

    expect(evaluationCategoryLabel('psicológica')).toBe('Psychological');
    expect(evaluationCategoryLabel('technical')).toBe('Technique');
    expect(evaluationCategoryLabel('raro')).toBe('raro');
  });
});

describe('planCategoryNormalization', () => {
  it('propone solo los valores reconocidos que no están ya canónicos', () => {
    const { changes, unchanged } = planCategoryNormalization([
      { id: 'e1', category: 'technical' },
      { id: 'e2', category: 'psicológica' },
      { id: 'e3', category: 'TÁCTICA' },
      { id: 'e4', category: 'mental' },
      { id: 'e5', category: 'physical' },
    ]);

    expect(changes).toEqual([
      { id: 'e2', from: 'psicológica', to: 'psychological' },
      { id: 'e3', from: 'TÁCTICA', to: 'tactical' },
    ]);
    expect(unchanged).toBe(3);
  });

  it('es idempotente: si todo está canónico no hay nada que cambiar', () => {
    const rows = [
      { id: 'e1', category: 'technical' },
      { id: 'e2', category: 'psychological' },
    ];
    expect(planCategoryNormalization(rows)).toEqual({ changes: [], unchanged: 2 });
  });
});

describe('goalStats', () => {
  it('cuenta estados, avance medio y metas pasadas de fecha', () => {
    const stats = goalStats(
      [
        { status: 'completed', dueDate: days(10) },
        { status: 'in_progress', dueDate: days(2) },
        { status: 'pending', dueDate: null },
        { status: 'weird', dueDate: new Date('2026-01-01T00:00:00Z') },
      ],
      NOW
    );
    expect(stats).toMatchObject({
      total: 4,
      completed: 1,
      inProgress: 1,
      pending: 2,
      open: 3,
      overdue: 2,
    });
    // 1 + 0.5 + 0 + 0 = 1.5 sobre 4 metas = 37.5% → 38
    expect(stats.percent).toBe(38);
  });

  it('sin metas el avance es 0', () => {
    expect(goalStats([], NOW).percent).toBe(0);
  });
});

describe('daysUntil', () => {
  it('cuenta días naturales (negativo si ya pasó)', () => {
    expect(daysUntil(new Date('2026-06-15T09:00:00Z'), NOW)).toBe(0);
    expect(daysUntil(new Date('2026-06-20T09:00:00Z'), NOW)).toBe(5);
    expect(daysUntil(new Date('2026-06-10T09:00:00Z'), NOW)).toBe(-5);
    expect(daysUntil(null, NOW)).toBeNull();
  });
});

describe('developmentScore', () => {
  it('los pesos suman 100 y un jugador sin datos puntúa 0', () => {
    const result = developmentScore({
      profilePercent: 0,
      evaluations: [],
      goals: [],
      training: [],
      now: NOW,
    });
    expect(result.factors.reduce((sum, factor) => sum + factor.weight, 0)).toBe(100);
    expect(result.score).toBe(0);
    expect(result.next?.key).toBe('profile');
    expect(result.trend).toBeNull();
  });

  it('un jugador con todo al día puntúa 100 y no tiene paso pendiente', () => {
    const result = developmentScore({
      profilePercent: 100,
      evaluations: [1, 2, 3, 4].map((n) => ({ score: 8, createdAt: days(n) })),
      goals: [{ status: 'completed', createdAt: days(20), updatedAt: days(1) }],
      training: Array.from({ length: 10 }, () => ({ completedAt: days(3) })),
      now: NOW,
    });
    expect(result.score).toBe(100);
    expect(result.next).toBeNull();
  });

  it('pondera cada factor y propone el paso con más puntos por ganar', () => {
    const result = developmentScore({
      profilePercent: 40, // 10/25
      evaluations: [{ score: 7, createdAt: days(5) }], // 1 de 4 → 5/20
      goals: [{ status: 'pending', createdAt: days(2), updatedAt: days(2) }], // 0/25
      training: [], // 0/20
      now: NOW,
    });
    expect(result.score).toBe(25); // 10 + 5 + 0 + 0 + 10 de constancia
    expect(result.factors.find((factor) => factor.key === 'goals')?.points).toBe(0);
    expect(result.next?.key).toBe('goals'); // 25 por ganar: el mayor pendiente
  });

  it('sin actividad reciente no da los puntos de constancia', () => {
    const result = developmentScore({
      profilePercent: 100,
      evaluations: [],
      goals: [],
      training: [{ completedAt: days(90) }],
      now: NOW,
    });
    expect(result.factors.find((factor) => factor.key === 'consistency')?.points).toBe(0);
    expect(result.score).toBe(27); // 25 de perfil + 2 de entrenamiento (1 de 10)
  });

  it('con una meta cumplida de dos, el factor de metas va a la mitad', () => {
    const result = developmentScore({
      profilePercent: 0,
      evaluations: [],
      goals: [
        { status: 'completed', createdAt: days(4), updatedAt: days(2) },
        { status: 'pending', createdAt: days(4), updatedAt: days(4) },
      ],
      training: [],
      now: NOW,
    });
    expect(result.factors.find((factor) => factor.key === 'goals')?.points).toBe(13); // 0.5 × 25
  });
});

describe('evaluationTrend', () => {
  it('sin los dos periodos no hay tendencia', () => {
    expect(evaluationTrend([], NOW)).toBeNull();
    expect(evaluationTrend([{ score: 8, createdAt: days(5) }], NOW)).toBeNull();
  });

  it('compara los últimos 30 días con los 30 anteriores', () => {
    expect(
      evaluationTrend(
        [
          { score: 9, createdAt: days(3) },
          { score: 6, createdAt: days(45) },
        ],
        NOW
      )
    ).toBe(3);
    expect(
      evaluationTrend(
        [
          { score: 4, createdAt: days(10) },
          { score: 7, createdAt: days(40) },
        ],
        NOW
      )
    ).toBe(-3);
  });
});

describe('developmentTimeline', () => {
  it('mezcla los hitos y ordena de más reciente a más antiguo', () => {
    const events = developmentTimeline({
      evaluations: [{ id: 'e1', category: 'technical', score: 8, createdAt: days(5) }],
      goals: [
        {
          id: 'g1',
          title: 'Improve left foot',
          status: 'completed',
          createdAt: days(20),
          updatedAt: days(1),
        },
        {
          id: 'g2',
          title: 'Be consistent',
          status: 'in_progress',
          createdAt: days(3),
          updatedAt: days(3),
        },
      ],
      career: [
        { id: 'c1', clubName: 'Future Baller Academy', season: '2025/26', createdAt: days(40) },
      ],
      training: [
        { id: 't1', title: 'Finishing', completedAt: days(2) },
        { id: 't2', title: 'Passing', completedAt: null },
      ],
    });

    expect(events.map((event) => event.id)).toEqual([
      'goal-g1',
      'training-t1',
      'goal-g2',
      'assessment-e1',
      'career-c1',
    ]);
    expect(events[0].celebrate).toBe(true);
    expect(events[0].title).toBe('Goal completed: Improve left foot');
    expect(events[2].detail).toBe('In progress');
    expect(events[4].title).toBe('Added Future Baller Academy');
  });

  it('respeta el límite de hitos', () => {
    const events = developmentTimeline(
      {
        evaluations: [
          { id: 'e1', category: 'technical', score: 8, createdAt: days(1) },
          { id: 'e2', category: 'physical', score: 6, createdAt: days(2) },
          { id: 'e3', category: 'tactical', score: 7, createdAt: days(3) },
        ],
        goals: [],
        career: [],
        training: [],
      },
      2
    );
    expect(events.map((event) => event.id)).toEqual(['assessment-e1', 'assessment-e2']);
  });
});
