/**
 * Lógica pura del área **My development** del jugador: puntuación de desarrollo
 * ponderada, resumen de evaluaciones por área, estado de las metas y la línea
 * temporal de hitos. Sin Prisma ni React: la página solo pinta lo que sale de aquí
 * y los tests cubren cada regla.
 */

// ---------------------------------------------------------------------------
// Áreas de evaluación y estados de meta
// ---------------------------------------------------------------------------

/** Las cuatro áreas que evalúa un entrenador (`Evaluation.category`). */
export const EVALUATION_CATEGORIES = [
  'technical',
  'physical',
  'tactical',
  'psychological',
] as const;
export type EvaluationCategory = (typeof EVALUATION_CATEGORIES)[number];

export const EVALUATION_CATEGORY_LABELS: Record<EvaluationCategory, string> = {
  technical: 'Technique',
  physical: 'Physical',
  tactical: 'Tactics',
  psychological: 'Psychological',
};

/** Estados de una meta (`PlayerGoal.status`). */
export const GOAL_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  pending: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

/**
 * Avance que representa cada estado (0-1). Única fuente de verdad del porcentaje
 * de una meta: alimenta las barras y la puntuación de desarrollo.
 */
export const GOAL_STATUS_PROGRESS: Record<GoalStatus, number> = {
  pending: 0,
  in_progress: 0.5,
  completed: 1,
};

/** ¿Es un estado de meta soportado? */
export function isGoalStatus(value: unknown): value is GoalStatus {
  return typeof value === 'string' && (GOAL_STATUSES as readonly string[]).includes(value);
}

/** ¿Es un área de evaluación soportada? */
export function isEvaluationCategory(value: unknown): value is EvaluationCategory {
  return typeof value === 'string' && (EVALUATION_CATEGORIES as readonly string[]).includes(value);
}

/** Normaliza un valor guardado (sin acentos, minúsculas) para comparar. */
function normalizeCategory(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Alias heredados: datos guardados en español (o con el nombre largo) que deben
 * caer en la misma categoría canónica y, por tanto, en el mismo eje del radar.
 */
const CATEGORY_ALIASES: Record<string, EvaluationCategory> = {
  tecnica: 'technical',
  tecnico: 'technical',
  fisica: 'physical',
  fisico: 'physical',
  tactica: 'tactical',
  tactico: 'tactical',
  psicologica: 'psychological',
  psicologico: 'psychological',
  psicologia: 'psychological',
};

/** Categoría canónica de un valor guardado (aunque venga en español); `null` si no se reconoce. */
export function canonicalEvaluationCategory(value: string): EvaluationCategory | null {
  const key = normalizeCategory(value);
  if (isEvaluationCategory(key)) return key;
  return CATEGORY_ALIASES[key] ?? null;
}

/** Etiqueta legible de un área (o el valor crudo si no se reconoce). */
export function evaluationCategoryLabel(category: string): string {
  const canonical = canonicalEvaluationCategory(category);
  return canonical ? EVALUATION_CATEGORY_LABELS[canonical] : category;
}

/** Media 0-10 con un decimal. */
const round1 = (value: number): number => Math.round(value * 10) / 10;

// ---------------------------------------------------------------------------
// Evaluaciones
// ---------------------------------------------------------------------------

export interface CategoryAverage {
  category: string;
  label: string;
  /** Media 0-10 con un decimal. */
  value: number;
  /** Nº de evaluaciones del área. */
  count: number;
}

export interface EvaluationSummary {
  count: number;
  /** Media global 0-10 con un decimal; `null` si no hay evaluaciones. */
  overall: number | null;
  /** Medias por área, de mayor a menor. */
  byCategory: CategoryAverage[];
  /** El área más fuerte. */
  strongest: CategoryAverage | null;
  /** El área más floja (solo si hay más de una). */
  weakest: CategoryAverage | null;
}

/** Resumen de las evaluaciones: media global, por área y las áreas extremas. */
export function evaluationSummary(
  evaluations: readonly { category: string; score: number }[]
): EvaluationSummary {
  if (evaluations.length === 0) {
    return { count: 0, overall: null, byCategory: [], strongest: null, weakest: null };
  }

  const overall = round1(
    evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length
  );

  const grouped = new Map<string, number[]>();
  for (const evaluation of evaluations) {
    // Los datos heredados (español) caen en la misma área que los canónicos, así
    // que el radar no duplica ejes por una etiqueta distinta.
    const key = canonicalEvaluationCategory(evaluation.category) ?? evaluation.category;
    const list = grouped.get(key) ?? [];
    list.push(evaluation.score);
    grouped.set(key, list);
  }

  const byCategory = Array.from(grouped.entries())
    .map(([category, scores]) => ({
      category,
      label: evaluationCategoryLabel(category),
      value: round1(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  return {
    count: evaluations.length,
    overall,
    byCategory,
    strongest: byCategory[0] ?? null,
    weakest: byCategory.length > 1 ? (byCategory.at(-1) ?? null) : null,
  };
}

// ---------------------------------------------------------------------------
// Metas
// ---------------------------------------------------------------------------

export interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  /** Metas vivas (pendientes o en curso). */
  open: number;
  /** Avance medio de todas las metas (0-100). */
  percent: number;
  /** Metas abiertas con la fecha ya pasada. */
  overdue: number;
}

/** Estado agregado de las metas del jugador. */
export function goalStats(
  goals: readonly { status: string; dueDate?: Date | null }[],
  now: Date = new Date()
): GoalStats {
  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let overdue = 0;
  let progressSum = 0;

  for (const goal of goals) {
    const status = isGoalStatus(goal.status) ? goal.status : 'pending';
    if (status === 'completed') completed += 1;
    else if (status === 'in_progress') inProgress += 1;
    else pending += 1;

    progressSum += GOAL_STATUS_PROGRESS[status];

    if (status !== 'completed' && goal.dueDate && goal.dueDate.getTime() < now.getTime()) {
      overdue += 1;
    }
  }

  const total = goals.length;
  return {
    total,
    completed,
    inProgress,
    pending,
    open: inProgress + pending,
    percent: total === 0 ? 0 : Math.round((progressSum / total) * 100),
    overdue,
  };
}

/**
 * Días que faltan para la fecha límite (negativo si ya pasó); `null` sin fecha.
 * Se cuentan días naturales, para que «due today» no salga como 0.4 días.
 */
export function daysUntil(dueDate: Date | null | undefined, now: Date = new Date()): number | null {
  if (!dueDate) return null;
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const end = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return Math.round((end - start) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Development score (sustituye al «%» que solo miraba si había algún dato)
// ---------------------------------------------------------------------------

export type DevelopmentFactorKey = 'profile' | 'assessments' | 'goals' | 'training' | 'consistency';

export interface DevelopmentFactor {
  key: DevelopmentFactorKey;
  label: string;
  hint: string;
  /** Máximo de puntos del factor (los pesos suman 100). */
  weight: number;
  /** Puntos conseguidos (0-`weight`). */
  points: number;
  /** Dónde se mejora ese factor. */
  href: string;
}

export interface DevelopmentScore {
  /** 0-100: suma ponderada de los cinco factores. */
  score: number;
  factors: DevelopmentFactor[];
  /** El factor con más puntos por ganar: el «siguiente mejor paso». */
  next: DevelopmentFactor | null;
  /** Evaluaciones de los últimos 30 días menos las de los 30 anteriores. */
  trend: number | null;
}

/** Objetivos que dan los puntos completos de cada factor. */
const ASSESSMENT_TARGET = 4;
const TRAINING_TARGET = 10;
const ACTIVITY_WINDOW_DAYS = 30;

const FACTOR_META: Record<
  DevelopmentFactorKey,
  { label: string; hint: string; weight: number; href: string }
> = {
  profile: {
    label: 'Profile',
    hint: 'A complete profile is the first thing a scout checks.',
    weight: 25,
    href: '/dashboard/player/profile/edit',
  },
  assessments: {
    label: 'Assessments',
    hint: 'Every assessment from your coach adds detail to your picture.',
    weight: 20,
    href: '/dashboard/player/development/evaluations',
  },
  goals: {
    label: 'Goals',
    hint: 'Set goals and move them forward — that is how you grow.',
    weight: 25,
    href: '/dashboard/player/development/goals',
  },
  training: {
    label: 'Training',
    hint: 'Content completed in the Football Center.',
    weight: 20,
    href: '/dashboard/player/training',
  },
  consistency: {
    label: 'Consistency',
    hint: 'Some movement in the last 30 days keeps the streak alive.',
    weight: 10,
    href: '/dashboard/player/training',
  },
};

export interface DevelopmentInput {
  /** Completado del perfil (0-100), de `playerProfileCompletion`. */
  profilePercent: number;
  evaluations: readonly { score: number; createdAt: Date }[];
  goals: readonly { status: string; createdAt: Date; updatedAt: Date }[];
  training: readonly { completedAt: Date | null }[];
  now?: Date;
}

const daysAgo = (date: Date, days: number): number => date.getTime() - days * 86_400_000;

/**
 * Puntuación de desarrollo 0-100 con su desglose.
 *
 * Pesos: perfil 25 · evaluaciones 20 · metas 25 · entrenamiento 20 · constancia 10.
 * Cada factor se satura a su objetivo (4 evaluaciones, 10 contenidos, avance medio
 * de las metas), así que la puntuación mide desarrollo real y no solo
 * «¿hay algún dato?».
 */
export function developmentScore(input: DevelopmentInput): DevelopmentScore {
  const now = input.now ?? new Date();

  const profilePoints = Math.round((Math.min(100, Math.max(0, input.profilePercent)) / 100) * 25);

  const assessmentsPoints = Math.round(
    (Math.min(input.evaluations.length, ASSESSMENT_TARGET) / ASSESSMENT_TARGET) * 20
  );

  const goalAverage =
    input.goals.length === 0
      ? 0
      : input.goals.reduce(
          (sum, goal) =>
            sum + GOAL_STATUS_PROGRESS[isGoalStatus(goal.status) ? goal.status : 'pending'],
          0
        ) / input.goals.length;
  const goalsPoints = Math.round(goalAverage * 25);

  const completedTraining = input.training.filter((item) => item.completedAt !== null).length;
  const trainingPoints = Math.round(
    (Math.min(completedTraining, TRAINING_TARGET) / TRAINING_TARGET) * 20
  );

  const since = daysAgo(now, ACTIVITY_WINDOW_DAYS);
  const active =
    input.evaluations.some((evaluation) => evaluation.createdAt.getTime() >= since) ||
    input.goals.some(
      (goal) => goal.updatedAt.getTime() >= since || goal.createdAt.getTime() >= since
    ) ||
    input.training.some((item) => (item.completedAt?.getTime() ?? 0) >= since);
  const consistencyPoints = active ? 10 : 0;

  const points: Record<DevelopmentFactorKey, number> = {
    profile: profilePoints,
    assessments: assessmentsPoints,
    goals: goalsPoints,
    training: trainingPoints,
    consistency: consistencyPoints,
  };

  const factors = (Object.keys(FACTOR_META) as DevelopmentFactorKey[]).map((key) => ({
    key,
    ...FACTOR_META[key],
    points: points[key],
  }));

  // Siguiente mejor paso: el pendiente con más puntos por ganar (empate → el primero).
  const next = factors.reduce<DevelopmentFactor | null>((best, factor) => {
    const left = factor.weight - factor.points;
    if (left <= 0) return best;
    if (!best) return factor;
    return left > best.weight - best.points ? factor : best;
  }, null);

  return {
    score: factors.reduce((sum, factor) => sum + factor.points, 0),
    factors,
    next,
    trend: evaluationTrend(input.evaluations, now),
  };
}

/** Media de los últimos 30 días menos la de los 30 anteriores (0-10). */
export function evaluationTrend(
  evaluations: readonly { score: number; createdAt: Date }[],
  now: Date = new Date()
): number | null {
  const recent = evaluations.filter(
    (evaluation) => evaluation.createdAt.getTime() >= daysAgo(now, 30)
  );
  const previous = evaluations.filter(
    (evaluation) =>
      evaluation.createdAt.getTime() < daysAgo(now, 30) &&
      evaluation.createdAt.getTime() >= daysAgo(now, 60)
  );
  if (recent.length === 0 || previous.length === 0) return null;

  const average = (list: readonly { score: number }[]): number =>
    list.reduce((sum, evaluation) => sum + evaluation.score, 0) / list.length;

  return round1(average(recent) - average(previous));
}

// ---------------------------------------------------------------------------
// Línea temporal de desarrollo
// ---------------------------------------------------------------------------

export type DevelopmentEventKind = 'assessment' | 'goal' | 'career' | 'training';

export interface DevelopmentEvent {
  id: string;
  kind: DevelopmentEventKind;
  title: string;
  detail: string | null;
  at: Date;
  href: string | null;
  /** Hito que se celebra (una meta cumplida). */
  celebrate: boolean;
}

export interface TimelineInput {
  evaluations: readonly { id: string; category: string; score: number; createdAt: Date }[];
  goals: readonly {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  career: readonly { id: string; clubName: string; season: string; createdAt: Date }[];
  training: readonly { id: string; title: string; completedAt: Date | null }[];
}

/**
 * Une evaluaciones, metas, trayectoria y entrenamiento en una sola línea
 * temporal (lo más reciente primero). Las metas cumplidas llegan marcadas para
 * celebrarlas en la UI.
 */
export function developmentTimeline(input: TimelineInput, limit = 6): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = [];

  for (const evaluation of input.evaluations) {
    events.push({
      id: `assessment-${evaluation.id}`,
      kind: 'assessment',
      title: `${evaluationCategoryLabel(evaluation.category)} assessment`,
      detail: `Scored ${evaluation.score}/10`,
      at: evaluation.createdAt,
      href: '/dashboard/player/development/evaluations',
      celebrate: false,
    });
  }

  for (const goal of input.goals) {
    const status = isGoalStatus(goal.status) ? goal.status : 'pending';
    const completed = status === 'completed';
    events.push({
      id: `goal-${goal.id}`,
      kind: 'goal',
      title: completed ? `Goal completed: ${goal.title}` : `Goal set: ${goal.title}`,
      detail: completed ? null : GOAL_STATUS_LABELS[status],
      at: completed ? goal.updatedAt : goal.createdAt,
      href: '/dashboard/player/development/goals',
      celebrate: completed,
    });
  }

  for (const entry of input.career) {
    events.push({
      id: `career-${entry.id}`,
      kind: 'career',
      title: `Added ${entry.clubName}`,
      detail: entry.season,
      at: entry.createdAt,
      href: '/dashboard/player/career',
      celebrate: false,
    });
  }

  for (const item of input.training) {
    if (!item.completedAt) continue;
    events.push({
      id: `training-${item.id}`,
      kind: 'training',
      title: `Training completed: ${item.title}`,
      detail: null,
      at: item.completedAt,
      href: '/dashboard/player/training',
      celebrate: false,
    });
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
