import { describe, expect, it } from 'vitest';
import {
  TRAINING_WEEKDAYS,
  TRAINING_WEEKDAY_LABELS,
  TRAINING_WEEKDAY_OPTIONS,
  trainingWeekdayLabel,
} from '@ifpc/config';
import { trainingSessionSchema } from '@ifpc/validation';
import { trainingVisibilityWhere, type PlayerTrainingAudience } from '@/lib/training';
import {
  sessionTotalMinutes,
  sessionVisibilityWhere,
  splitTrainingSessions,
  type TrainingSessionView,
} from '@/lib/training-sessions';

function session(overrides: Partial<TrainingSessionView>): TrainingSessionView {
  return {
    id: 'session-1',
    title: 'Session',
    description: null,
    weekday: null,
    status: 'PUBLISHED',
    publishAt: null,
    ownerType: 'GENERAL',
    author: { id: null, name: 'Future Baller' },
    totalMinutes: 0,
    items: [],
    completedCount: 0,
    ...overrides,
  };
}

describe('días de la semana', () => {
  it('tiene etiqueta para cada día y las opciones van en orden', () => {
    for (const day of TRAINING_WEEKDAYS) expect(TRAINING_WEEKDAY_LABELS[day]).toBeTruthy();
    expect(TRAINING_WEEKDAY_OPTIONS.map((option) => option.value)).toEqual(
      TRAINING_WEEKDAYS.map(String)
    );
  });

  it('sin día asignado devuelve null', () => {
    expect(trainingWeekdayLabel(2)).toBe('Wednesday');
    expect(trainingWeekdayLabel(null)).toBeNull();
    expect(trainingWeekdayLabel(undefined)).toBeNull();
  });
});

describe('trainingSessionSchema', () => {
  it('acepta una sesión con día y sin día', () => {
    expect(trainingSessionSchema.safeParse({ title: 'Session 3', weekday: 2 }).success).toBe(true);
    expect(trainingSessionSchema.safeParse({ title: 'Session 3' }).success).toBe(true);
  });

  it('rechaza un día fuera de la semana y un título corto', () => {
    expect(trainingSessionSchema.safeParse({ title: 'Session 3', weekday: 7 }).success).toBe(false);
    expect(trainingSessionSchema.safeParse({ title: 'Session 3', weekday: -1 }).success).toBe(
      false
    );
    expect(trainingSessionSchema.safeParse({ title: 'X' }).success).toBe(false);
  });
});

describe('sessionTotalMinutes', () => {
  it('suma la duración de los ejercicios que la tienen', () => {
    expect(
      sessionTotalMinutes([
        { durationMinutes: 15 },
        { durationMinutes: null },
        { durationMinutes: 20 },
      ])
    ).toBe(35);
    expect(sessionTotalMinutes([])).toBe(0);
  });
});

describe('splitTrainingSessions', () => {
  it('separa las sesiones por origen', () => {
    const groups = splitTrainingSessions([
      session({ id: 's-general', ownerType: 'GENERAL' }),
      session({ id: 's-coach', ownerType: 'COACH' }),
      session({ id: 's-club', ownerType: 'CLUB' }),
      session({ id: 's-club-2', ownerType: 'CLUB' }),
    ]);

    expect(groups.general.map((entry) => entry.id)).toEqual(['s-general']);
    expect(groups.coach.map((entry) => entry.id)).toEqual(['s-coach']);
    expect(groups.club.map((entry) => entry.id)).toEqual(['s-club', 's-club-2']);
  });
});

describe('sessionVisibilityWhere', () => {
  const audience: PlayerTrainingAudience = {
    playerId: 'player-1',
    coachIds: ['coach-1'],
    clubIds: ['club-1'],
  };

  it('usa la misma regla de visibilidad que el contenido', () => {
    const now = new Date('2026-01-01T12:00:00Z');

    expect(sessionVisibilityWhere(audience, now)).toEqual(trainingVisibilityWhere(audience, now));
  });

  it('un día actual no cambia la visibilidad (depende del estado y la fecha)', () => {
    const now = new Date('2026-01-01T12:00:00Z');

    expect(sessionVisibilityWhere({ playerId: 'p', coachIds: [], clubIds: [] }, now)).toEqual({
      AND: [
        { status: 'PUBLISHED' },
        { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
        { OR: [{ ownerType: 'GENERAL' }] },
      ],
    });
  });
});
