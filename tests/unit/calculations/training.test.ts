import { describe, expect, it } from 'vitest';
import {
  TRAINING_AUTHOR_CATEGORIES,
  TRAINING_CATEGORIES,
  TRAINING_KINDS,
  TRAINING_KIND_LABELS,
  TRAINING_ORIGINS,
  TRAINING_ORIGIN_LABELS,
  TRAINING_SCHEDULE_MIN_LEAD_MINUTES,
  TRAINING_STATUSES,
  TRAINING_STATUS_LABELS,
  isTrainingCategory,
  isTrainingKind,
  isTrainingOrigin,
  isTrainingStatus,
  trainingCategoryLabel,
} from '@ifpc/config';
import { trainingContentSchema } from '@ifpc/validation';
import {
  isTrainingVisibleNow,
  resolveTrainingVisibility,
  shouldNotifyOnSave,
  splitTraining,
  trainingPublishState,
  trainingPublishStateLabel,
  trainingVisibilityWhere,
  type PlayerTrainingAudience,
  type TrainingItem,
} from '@/lib/training';
import { parsePassScore, parseQuizQuestions, quizQuestionsToText } from '@/lib/training-quiz';

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
    status: 'PUBLISHED',
    publishAt: null,
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

  it('expone etiquetas para cada estado de publicación', () => {
    for (const status of TRAINING_STATUSES) expect(TRAINING_STATUS_LABELS[status]).toBeTruthy();
    expect(isTrainingStatus('DRAFT')).toBe(true);
    expect(isTrainingStatus('HIDDEN')).toBe(false);
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
  const now = new Date('2026-01-01T12:00:00Z');

  it('incluye lo general, sus coaches y sus clubes, solo si está publicado', () => {
    expect(trainingVisibilityWhere(audience, now)).toEqual({
      AND: [
        { status: 'PUBLISHED' },
        { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
        {
          OR: [
            { ownerType: 'GENERAL' },
            { ownerType: 'COACH', coachId: { in: ['coach-1'] } },
            { ownerType: 'CLUB', clubId: { in: ['club-1'] } },
          ],
        },
      ],
    });
  });

  it('sin coaches ni clubes solo deja el contenido general', () => {
    expect(trainingVisibilityWhere({ playerId: 'p', coachIds: [], clubIds: [] }, now)).toEqual({
      AND: [
        { status: 'PUBLISHED' },
        { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
        { OR: [{ ownerType: 'GENERAL' }] },
      ],
    });
  });
});

describe('estado de publicación', () => {
  const now = new Date('2026-01-01T12:00:00Z');

  it('un borrador se marca como borrador y no se ve', () => {
    const draft = { status: 'DRAFT' as const, publishAt: null };
    expect(trainingPublishState(draft, now)).toBe('DRAFT');
    expect(trainingPublishStateLabel(draft, now)).toBe('Draft');
    expect(isTrainingVisibleNow(draft, now)).toBe(false);
  });

  it('un publicado con fecha futura está programado y aún no se ve', () => {
    const scheduled = { status: 'PUBLISHED' as const, publishAt: new Date('2026-01-02T08:00:00Z') };
    expect(trainingPublishState(scheduled, now)).toBe('SCHEDULED');
    expect(trainingPublishStateLabel(scheduled, now)).toBe('Scheduled');
    expect(isTrainingVisibleNow(scheduled, now)).toBe(false);
  });

  it('al llegar la fecha pasa a publicado sin tocar la base de datos', () => {
    const scheduled = { status: 'PUBLISHED' as const, publishAt: new Date('2026-01-01T11:00:00Z') };
    const later = new Date('2026-01-01T12:00:00Z');
    expect(trainingPublishState(scheduled, later)).toBe('PUBLISHED');
    expect(isTrainingVisibleNow(scheduled, later)).toBe(true);
  });

  it('publicado sin fecha se ve ya', () => {
    const published = { status: 'PUBLISHED' as const, publishAt: null };
    expect(trainingPublishState(published, now)).toBe('PUBLISHED');
    expect(isTrainingVisibleNow(published, now)).toBe(true);
  });
});

describe('shouldNotifyOnSave', () => {
  const now = new Date('2026-01-01T12:00:00Z');
  const visible = { status: 'PUBLISHED' as const, publishAt: null };
  const draft = { status: 'DRAFT' as const, publishAt: null };
  const scheduled = { status: 'PUBLISHED' as const, publishAt: new Date('2026-02-01T10:00:00Z') };

  it('avisa al crear algo visible desde el principio', () => {
    expect(shouldNotifyOnSave(null, visible, now)).toBe(true);
    expect(shouldNotifyOnSave(null, draft, now)).toBe(false);
    expect(shouldNotifyOnSave(null, scheduled, now)).toBe(false);
  });

  it('avisa al pasar de borrador o programado a visible', () => {
    expect(shouldNotifyOnSave(draft, visible, now)).toBe(true);
    expect(shouldNotifyOnSave(scheduled, visible, now)).toBe(true);
  });

  it('no repite el aviso al editar algo que ya se veía', () => {
    expect(shouldNotifyOnSave(visible, visible, now)).toBe(false);
  });

  it('no avisa al volver a borrador', () => {
    expect(shouldNotifyOnSave(visible, draft, now)).toBe(false);
  });
});

describe('resolveTrainingVisibility', () => {
  const now = new Date('2026-01-01T12:00:00Z');

  it('sin visibilidad explícita publica ya', () => {
    expect(resolveTrainingVisibility({}, now)).toEqual({ status: 'PUBLISHED', publishAt: null });
    expect(resolveTrainingVisibility({ mode: 'PUBLISHED' }, now)).toEqual({
      status: 'PUBLISHED',
      publishAt: null,
    });
  });

  it('un valor raro no impide publicar', () => {
    expect(resolveTrainingVisibility({ mode: 'HIDDEN' }, now)).toEqual({
      status: 'PUBLISHED',
      publishAt: null,
    });
  });

  it('guarda como borrador', () => {
    expect(
      resolveTrainingVisibility({ mode: 'DRAFT', publishAt: '2026-05-05T10:00' }, now)
    ).toEqual({
      status: 'DRAFT',
      publishAt: null,
    });
  });

  it('programa una fecha futura', () => {
    const result = resolveTrainingVisibility(
      { mode: 'SCHEDULED', publishAt: '2026-05-05T10:00' },
      now
    );
    expect(result).toEqual({ status: 'PUBLISHED', publishAt: new Date('2026-05-05T10:00') });
  });

  it('rechaza una fecha ilegible o demasiado próxima', () => {
    expect(
      resolveTrainingVisibility({ mode: 'SCHEDULED', publishAt: 'mañana' }, now)
    ).toHaveProperty('error');
    expect(
      resolveTrainingVisibility({ mode: 'SCHEDULED', publishAt: now.toISOString() }, now)
    ).toHaveProperty('error');
    // El margen mínimo se aplica: un minuto menos de lo exigido no vale.
    const justBelow = new Date(now.getTime() + (TRAINING_SCHEDULE_MIN_LEAD_MINUTES - 1) * 60_000);
    expect(
      resolveTrainingVisibility({ mode: 'SCHEDULED', publishAt: justBelow.toISOString() }, now)
    ).toHaveProperty('error');
  });
});

describe('parseQuizQuestions', () => {
  it('lee una pregunta por línea con la primera opción como correcta', () => {
    expect(
      parseQuizQuestions('What should the first touch have? | A purpose | Maximum power')
    ).toEqual([
      {
        prompt: 'What should the first touch have?',
        options: ['A purpose', 'Maximum power'],
      },
    ]);
  });

  it('ignora líneas vacías, comentarios y preguntas sin opciones suficientes', () => {
    const raw = [
      '# comentario',
      '',
      'Only prompt',
      'Prompt | una sola opción',
      'Good? | A | B',
    ].join('\n');
    expect(parseQuizQuestions(raw)).toHaveLength(1);
    expect(parseQuizQuestions(null)).toEqual([]);
    expect(parseQuizQuestions(undefined)).toEqual([]);
  });

  it('recorta los espacios de cada parte', () => {
    expect(parseQuizQuestions('  Q?  |  Correct  |  Wrong  ')).toEqual([
      { prompt: 'Q?', options: ['Correct', 'Wrong'] },
    ]);
  });
});

describe('quizQuestionsToText', () => {
  it('vuelca la correcta primero, para poder editarlo y volver a guardarlo', () => {
    const text = quizQuestionsToText([
      {
        prompt: 'Q?',
        options: [
          { label: 'Wrong', isCorrect: false },
          { label: 'Correct', isCorrect: true },
        ],
      },
    ]);

    expect(text).toBe('Q? | Correct | Wrong');
    expect(parseQuizQuestions(text)[0].options[0]).toBe('Correct');
  });
});

describe('parsePassScore', () => {
  it('acota entre 1 y 100 y usa 70 por defecto', () => {
    expect(parsePassScore('85')).toBe(85);
    expect(parsePassScore('0')).toBe(1);
    expect(parsePassScore('500')).toBe(100);
    expect(parsePassScore('')).toBe(70);
    expect(parsePassScore(null)).toBe(70);
  });
});
