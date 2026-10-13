import { prisma } from '@ifpc/database';
import {
  TRAINING_PUBLISH_STATE_LABELS,
  TRAINING_SCHEDULE_MIN_LEAD_MINUTES,
  isTrainingStatus,
  type TrainingKind,
  type TrainingOrigin,
  type TrainingPublishState,
  type TrainingStatus,
} from '@ifpc/config';

/** Estados de contrato que cuentan como «estar en el club» (igual que los live de club). */
const ACTIVE_CONTRACT_STATUSES = ['SIGNED', 'ACTIVE'];

/** Autor del contenido: se muestra en la tarjeta y en el detalle. */
export interface TrainingAuthor {
  id: string | null;
  name: string;
}

/** Contenido del Football Center listo para pintar. */
export interface TrainingItem {
  id: string;
  title: string;
  category: string;
  kind: TrainingKind;
  ownerType: TrainingOrigin;
  description: string | null;
  durationMinutes: number | null;
  difficulty: number | null;
  /** Nº de preguntas del quiz (0 si no tiene). */
  quizQuestions: number;
  /** Borrador o publicado (solo lo ve el autor hasta que publica). */
  status: TrainingStatus;
  /** Fecha de publicación programada (`null` = publicar ya). */
  publishAt: Date | null;
  /** Cuándo lo completó el jugador (`null` si sigue pendiente). */
  completedAt: Date | null;
  author: TrainingAuthor;
}

/** A quién le llega el contenido de coaches y clubes. */
export interface PlayerTrainingAudience {
  playerId: string | null;
  coachIds: string[];
  clubIds: string[];
}

/**
 * Audiencia de un jugador en el Football Center: los coaches a los que está
 * vinculado (`CoachPlayer`) y los clubes en los que tiene contrato firmado o
 * activo. El contenido **general** lo ve cualquier jugador.
 */
export async function playerTrainingAudience(userId: string): Promise<PlayerTrainingAudience> {
  const player = await prisma.player.findUnique({ where: { userId }, select: { id: true } });
  if (!player) return { playerId: null, coachIds: [], clubIds: [] };

  const [links, contracts] = await Promise.all([
    prisma.coachPlayer.findMany({ where: { playerId: player.id }, select: { coachId: true } }),
    prisma.contract.findMany({
      where: { playerId: player.id, status: { in: ACTIVE_CONTRACT_STATUSES } },
      select: { clubId: true },
    }),
  ]);

  return {
    playerId: player.id,
    coachIds: links.map((link) => link.coachId),
    clubIds: contracts.map((contract) => contract.clubId),
  };
}

/** Condiciones del contenido **visible**: publicado y sin fecha futura pendiente. */
function publishedConditions(now: Date): Record<string, unknown>[] {
  return [{ status: 'PUBLISHED' }, { OR: [{ publishAt: null }, { publishAt: { lte: now } }] }];
}

/** Orígenes de los que ve contenido una audiencia: general, sus coaches y clubes. */
function ownerTypeConditions(audience: PlayerTrainingAudience): Record<string, unknown>[] {
  const visible: Record<string, unknown>[] = [{ ownerType: 'GENERAL' }];
  if (audience.coachIds.length > 0) {
    visible.push({ ownerType: 'COACH', coachId: { in: audience.coachIds } });
  }
  if (audience.clubIds.length > 0) {
    visible.push({ ownerType: 'CLUB', clubId: { in: audience.clubIds } });
  }
  return visible;
}

/**
 * Condición Prisma del contenido visible para esa audiencia: lo que le toca por
 * origen **y** ya está publicado (los borradores y lo programado no se filtran).
 */
export function trainingVisibilityWhere(audience: PlayerTrainingAudience, now: Date = new Date()) {
  return {
    AND: [...publishedConditions(now), { OR: ownerTypeConditions(audience) }],
  };
}

/** Nombre del autor que se pinta en las tarjetas. */
function authorOf(content: {
  ownerType: string;
  coach: { id: string; clubName: string | null; user: { name: string | null } } | null;
  club: { id: string; name: string } | null;
}): TrainingAuthor {
  if (content.ownerType === 'COACH' && content.coach) {
    return {
      id: content.coach.id,
      name: content.coach.clubName ?? content.coach.user.name ?? 'Coach',
    };
  }
  if (content.ownerType === 'CLUB' && content.club) {
    return { id: content.club.id, name: content.club.name };
  }
  return { id: null, name: 'Future Baller' };
}

/** Fila de `TrainingContent` con el quiz y el autor incluidos. */
interface TrainingContentRow {
  id: string;
  title: string;
  category: string;
  kind: string;
  ownerType: string;
  description: string | null;
  durationMinutes: number | null;
  difficulty: number | null;
  quiz: { _count: { questions: number } } | null;
  status: string;
  publishAt: Date | null;
  coach: { id: string; clubName: string | null; user: { name: string | null } } | null;
  club: { id: string; name: string } | null;
}

/** `include` compartido por las consultas de contenido del Football Center. */
const CONTENT_INCLUDE = {
  quiz: { select: { _count: { select: { questions: true } } } },
  coach: { select: { id: true, clubName: true, user: { select: { name: true } } } },
  club: { select: { id: true, name: true } },
} as const;

/** Convierte una fila de Prisma en el contenido que pintan las tarjetas. */
function mapContentRow(row: TrainingContentRow, completedAt: Date | null = null): TrainingItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    kind: row.kind as TrainingKind,
    ownerType: row.ownerType as TrainingOrigin,
    description: row.description,
    durationMinutes: row.durationMinutes,
    difficulty: row.difficulty,
    quizQuestions: row.quiz?._count.questions ?? 0,
    status: row.status as TrainingStatus,
    publishAt: row.publishAt,
    completedAt,
    author: authorOf(row),
  };
}

/**
 * Estado con el que se muestra el contenido a su autor: un `PUBLISHED` con fecha
 * futura está **programado** (todavía no lo ve nadie).
 */
export function trainingPublishState(
  content: { status: TrainingStatus; publishAt: Date | null },
  now: Date = new Date()
): TrainingPublishState {
  if (content.status === 'DRAFT') return 'DRAFT';
  if (content.publishAt && content.publishAt.getTime() > now.getTime()) return 'SCHEDULED';
  return 'PUBLISHED';
}

/** Etiqueta del estado («Draft», «Scheduled», «Published»). */
export function trainingPublishStateLabel(
  content: { status: TrainingStatus; publishAt: Date | null },
  now: Date = new Date()
): string {
  return TRAINING_PUBLISH_STATE_LABELS[trainingPublishState(content, now)];
}

/**
 * ¿Lo ve ya su audiencia? Es la misma regla que aplica `trainingVisibilityWhere`,
 * así que acciones, avisos y programador comparten criterio.
 */
export function isTrainingVisibleNow(
  content: { status: TrainingStatus; publishAt: Date | null },
  now: Date = new Date()
): boolean {
  if (content.status !== 'PUBLISHED') return false;
  return !content.publishAt || content.publishAt.getTime() <= now.getTime();
}

/**
 * ¿Hay que avisar a los jugadores al guardar? Solo cuando el contenido **pasa** a
 * ser visible (borrador o programado → publicado ya), nunca de nuevo al editarlo.
 */
export function shouldNotifyOnSave(
  before: { status: TrainingStatus; publishAt: Date | null } | null,
  after: { status: TrainingStatus; publishAt: Date | null },
  now: Date = new Date()
): boolean {
  if (before && isTrainingVisibleNow(before, now)) return false;
  return isTrainingVisibleNow(after, now);
}

/**
 * Traduce la visibilidad que llega del formulario: `DRAFT` (borrador),
 * `SCHEDULED` (publicado con fecha futura) o `PUBLISHED` (visible ya). `publishAt`
 * es una fecha local del navegador (`datetime-local`); si no se puede leer o no
 * deja margen suficiente se devuelve un error legible en vez de programar algo
 * que nacería caducado.
 */
export function resolveTrainingVisibility(
  input: { mode?: string | null; publishAt?: string | null },
  now: Date = new Date()
): { status: TrainingStatus; publishAt: Date | null } | { error: string } {
  const mode = input.mode && isTrainingStatus(input.mode) ? input.mode : 'PUBLISHED';
  if (mode === 'DRAFT') return { status: 'DRAFT', publishAt: null };
  if (!input.publishAt) return { status: 'PUBLISHED', publishAt: null };

  const scheduledAt = new Date(input.publishAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: 'Pick a valid date and time to schedule the publication.' };
  }

  const minLead = now.getTime() + TRAINING_SCHEDULE_MIN_LEAD_MINUTES * 60_000;
  if (scheduledAt.getTime() < minLead) {
    return {
      error: `To schedule, pick a date at least ${TRAINING_SCHEDULE_MIN_LEAD_MINUTES} minutes from now.`,
    };
  }

  return { status: 'PUBLISHED', publishAt: scheduledAt };
}

/**
 * Todo el contenido del Football Center que puede ver un jugador, con su progreso.
 * La página lo trocea con `splitTraining` por tipo (curso/ejercicio) y origen.
 */
export async function listPlayerTraining(
  userId: string
): Promise<{ audience: PlayerTrainingAudience; items: TrainingItem[] }> {
  const audience = await playerTrainingAudience(userId);

  const rows = await prisma.trainingContent.findMany({
    where: trainingVisibilityWhere(audience),
    orderBy: [{ createdAt: 'asc' }],
    include: CONTENT_INCLUDE,
  });

  const progress = audience.playerId
    ? await prisma.trainingProgress.findMany({
        where: { playerId: audience.playerId, contentId: { in: rows.map((row) => row.id) } },
        select: { contentId: true, completedAt: true },
      })
    : [];
  const completedBy = new Map(progress.map((row) => [row.contentId, row.completedAt ?? null]));

  const items = rows.map((row) => mapContentRow(row, completedBy.get(row.id) ?? null));

  return { audience, items };
}

/**
 * Contenido publicado por un autor (coach o club) para su propia área: los
 * cursos y ejercicios que puede gestionar y borrar.
 */
export async function listAuthoredTraining(
  owner: { coachId: string } | { clubId: string }
): Promise<TrainingItem[]> {
  const rows = await prisma.trainingContent.findMany({
    where: 'coachId' in owner ? { coachId: owner.coachId } : { clubId: owner.clubId },
    orderBy: { createdAt: 'desc' },
    include: CONTENT_INCLUDE,
  });

  return rows.map((row) => mapContentRow(row));
}

/** Trocea el contenido por origen para una pestaña (cursos o ejercicios). */
export function splitTraining(
  items: TrainingItem[],
  kind: TrainingKind
): { general: TrainingItem[]; coach: TrainingItem[]; club: TrainingItem[] } {
  const ofKind = items.filter((item) => item.kind === kind);
  return {
    general: ofKind.filter((item) => item.ownerType === 'GENERAL'),
    coach: ofKind.filter((item) => item.ownerType === 'COACH'),
    club: ofKind.filter((item) => item.ownerType === 'CLUB'),
  };
}

/** Actividad reciente del jugador en el Football Center. */
export interface TrainingActivity {
  id: string;
  title: string;
  kind: TrainingKind;
  /** `quiz` = intento de examen; `completed` = curso o ejercicio completado. */
  label: 'quiz' | 'completed';
  /** Resultado del intento (solo en los quizzes). */
  percent: number | null;
  passed: boolean | null;
  date: Date;
}

/** Resumen de progreso del jugador para la pestaña «My progress». */
export interface TrainingProgressSummary {
  courses: { total: number; completed: number; passed: number };
  exercises: { total: number; completed: number };
  quizzes: { attempts: number; best: number };
  activity: TrainingActivity[];
}

/**
 * Resumen del progreso sobre el contenido visible: cursos y ejercicios
 * completados, exámenes hechos y la actividad reciente ordenada por fecha.
 */
export async function playerTrainingSummary(
  items: TrainingItem[],
  playerId: string | null
): Promise<TrainingProgressSummary> {
  const courses = items.filter((item) => item.kind === 'COURSE');
  const exercises = items.filter((item) => item.kind === 'EXERCISE');

  if (!playerId || items.length === 0) {
    return {
      courses: { total: courses.length, completed: 0, passed: 0 },
      exercises: { total: exercises.length, completed: 0 },
      quizzes: { attempts: 0, best: 0 },
      activity: [],
    };
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { playerId, quiz: { contentId: { in: items.map((item) => item.id) } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { quiz: { select: { contentId: true } } },
  });

  const titleByContentId = new Map(items.map((item) => [item.id, item.title]));
  const passedCourseIds = new Set<string>();

  const activity: TrainingActivity[] = attempts.map((attempt) => {
    const contentId = attempt.quiz.contentId;
    if (attempt.passed) passedCourseIds.add(contentId);
    return {
      id: `quiz-${attempt.id}`,
      title: titleByContentId.get(contentId) ?? 'Course',
      kind: 'COURSE' as TrainingKind,
      label: 'quiz' as const,
      percent: attempt.percent,
      passed: attempt.passed,
      date: attempt.createdAt,
    };
  });

  for (const item of items) {
    if (!item.completedAt) continue;
    activity.push({
      id: `done-${item.id}`,
      title: item.title,
      kind: item.kind,
      label: 'completed',
      percent: null,
      passed: null,
      date: item.completedAt,
    });
  }
  activity.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    courses: {
      total: courses.length,
      completed: courses.filter((item) => item.completedAt).length,
      passed: passedCourseIds.size,
    },
    exercises: {
      total: exercises.length,
      completed: exercises.filter((item) => item.completedAt).length,
    },
    quizzes: {
      attempts: attempts.length,
      best: attempts.reduce((max, attempt) => Math.max(max, attempt.percent), 0),
    },
    activity: activity.slice(0, 8),
  };
}

/** Nº de jugadores que verán el contenido de un coach (`CoachPlayer`). */
export async function coachPlayerCount(coachId: string): Promise<number> {
  return prisma.coachPlayer.count({ where: { coachId } });
}

/** Nº de jugadores con contrato firmado o activo en un club. */
export async function clubPlayerCount(clubId: string): Promise<number> {
  return prisma.contract.count({
    where: { clubId, status: { in: ACTIVE_CONTRACT_STATUSES } },
  });
}

/**
 * Condición de visibilidad del contenido para cualquier usuario: lo general, lo
 * de sus coaches y clubes y, si publica contenido, **todo lo suyo** (incluidos
 * borradores y programados). La usa la API para no exponer el contenido privado
 * de un club o un coach.
 */
export async function visibleTrainingWhere(userId: string, now: Date = new Date()) {
  const audience = await playerTrainingAudience(userId);
  const [coach, club] = await Promise.all([
    prisma.coach.findUnique({ where: { userId }, select: { id: true } }),
    prisma.club.findUnique({ where: { userId }, select: { id: true } }),
  ]);

  const owned: Record<string, unknown>[] = [];
  if (coach) owned.push({ ownerType: 'COACH', coachId: coach.id });
  if (club) owned.push({ ownerType: 'CLUB', clubId: club.id });

  const published = trainingVisibilityWhere(audience, now);
  return owned.length > 0 ? { OR: [published, ...owned] } : published;
}
