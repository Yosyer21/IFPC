import { describe, expect, it } from 'vitest';
import {
  TRAINING_AUTHOR_CATEGORIES,
  TRAINING_CATEGORIES,
  TRAINING_KINDS,
  TRAINING_KIND_LABELS,
  TRAINING_ORIGINS,
  TRAINING_ORIGIN_LABELS,
  isTrainingCategory,
  isTrainingKind,
  isTrainingOrigin,
  trainingCategoryLabel,
} from '@ifpc/config';
import { trainingContentSchema } from '@ifpc/validation';
import {
  splitTraining,
  trainingVisibilityWhere,
  type PlayerTrainingAudience,
  type TrainingItem,
} from '@/lib/training';

function item(overrides: Partial<TrainingItem>): TrainingItem {
  return {
    id: 'content-1',
    title: 'Content',
    category: 'technical',
    kind: 'COURSE',
    ownerType: 'GENERAL',
    description: null,
    durationMinutes: null,
    difficulty: null,
    quizQuestions: 0,
    completedAt: null,
    author: { id: null, name: 'Future Baller' },
    ...overrides,
  };
}

describe('catálogo de tipos y orígenes', () => {
  it('expone etiquetas para cada tipo y origen', () => {
    for (const kind of TRAINING_KINDS) expect(TRAINING_KIND_LABELS[kind]).toBeTruthy();
    for (const origin of TRAINING_ORIGINS) expect(TRAINING_ORIGIN_LABELS[origin]).toBeTruthy();
  });

  it('reconoce solo lo declarado', () => {
    expect(isTrainingKind('COURSE')).toBe(true);
    expect(isTrainingKind('VIDEO')).toBe(false);
    expect(isTrainingOrigin('COACH')).toBe(true);
    expect(isTrainingOrigin('PLATFORM')).toBe(false);
    expect(isTrainingCategory('technical')).toBe(true);
    expect(isTrainingCategory('tactics')).toBe(false);
  });

  it('las categorías de autor son un subconjunto de las del catálogo', () => {
    for (const category of TRAINING_AUTHOR_CATEGORIES) {
      expect(TRAINING_CATEGORIES).toContain(category);
    }
  });

  it('la etiqueta de categoría tolera lo desconocido', () => {
    expect(trainingCategoryLabel('technical')).toBe('Technique');
    expect(trainingCategoryLabel('tactics')).toBe('tactics');
  });
});

describe('trainingContentSchema', () => {
  it('acepta todos los tipos y categorías del catálogo (no se desincronizan)', () => {
    for (const kind of TRAINING_KINDS) {
      for (const category of TRAINING_CATEGORIES) {
        const parsed = trainingContentSchema.safeParse({ kind, category, title: 'Cone drill' });
        expect(parsed.success).toBe(true);
      }
    }
  });

  it('rechaza un tipo o una categoría desconocidos', () => {
    expect(
      trainingContentSchema.safeParse({ kind: 'VIDEO', category: 'technical', title: 'Cone drill' })
        .success
    ).toBe(false);
    expect(
      trainingContentSchema.safeParse({ kind: 'COURSE', category: 'tactics', title: 'Cone drill' })
        .success
    ).toBe(false);
  });

  it('exige un título con contenido y acota el nivel', () => {
    expect(
      trainingContentSchema.safeParse({ kind: 'COURSE', category: 'technical', title: 'X' }).success
    ).toBe(false);
    expect(
      trainingContentSchema.safeParse({
        kind: 'COURSE',
        category: 'technical',
        title: 'Cone drill',
        difficulty: 9,
      }).success
    ).toBe(false);
  });
});

describe('splitTraining', () => {
  const items = [
    item({ id: 'c-general', kind: 'COURSE', ownerType: 'GENERAL' }),
    item({ id: 'c-coach', kind: 'COURSE', ownerType: 'COACH' }),
    item({ id: 'e-club', kind: 'EXERCISE', ownerType: 'CLUB' }),
    item({ id: 'e-general', kind: 'EXERCISE', ownerType: 'GENERAL' }),
  ];

  it('separa por tipo y origen', () => {
    const courses = splitTraining(items, 'COURSE');
    expect(courses.general.map((entry) => entry.id)).toEqual(['c-general']);
    expect(courses.coach.map((entry) => entry.id)).toEqual(['c-coach']);
    expect(courses.club).toEqual([]);

    const exercises = splitTraining(items, 'EXERCISE');
    expect(exercises.general.map((entry) => entry.id)).toEqual(['e-general']);
    expect(exercises.club.map((entry) => entry.id)).toEqual(['e-club']);
    expect(exercises.coach).toEqual([]);
  });
});

describe('trainingVisibilityWhere', () => {
  const audience: PlayerTrainingAudience = {
    playerId: 'player-1',
    coachIds: ['coach-1'],
    clubIds: ['club-1'],
  };

  it('incluye lo general, sus coaches y sus clubes', () => {
    expect(trainingVisibilityWhere(audience)).toEqual({
      OR: [
        { ownerType: 'GENERAL' },
        { ownerType: 'COACH', coachId: { in: ['coach-1'] } },
        { ownerType: 'CLUB', clubId: { in: ['club-1'] } },
      ],
    });
  });

  it('sin coaches ni clubes solo deja el contenido general', () => {
    expect(trainingVisibilityWhere({ playerId: 'p', coachIds: [], clubIds: [] })).toEqual({
      OR: [{ ownerType: 'GENERAL' }],
    });
  });
});
