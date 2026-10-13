import { prisma } from '@ifpc/database';
import { trainingWorkloadLabel, type TrainingOrigin, type TrainingStatus } from '@ifpc/config';
import {
  authorOf,
  ownerTypeConditions,
  playerTrainingAudience,
  publishedConditions,
  type PlayerTrainingAudience,
  type TrainingAuthor,
} from '@/lib/training';

/**
 * Sesiones (planes) del Football Center. Comparten con el contenido la regla de
 * visibilidad (`publishedConditions` + `ownerTypeConditions`), así que un borrador
 * o una sesión programada tampoco se filtran al jugador.
 */

/** Ejercicio dentro de una sesión, listo para pintar. */
export interface TrainingSessionItemView {
  /** Id de la fila de la sesión (para quitar o reordenar). */
  id: string;
  contentId: string;
  title: string;
  category: string;
  durationMinutes: number | null;
  /** Carga de la ficha del contenido («4 × 4 min · rest 1 min 30 s»). */
  workload: string | null;
  /** Nota del autor para este ejercicio dentro de la sesión. */
  notes: string | null;
  /** Si el jugador ya lo completó (siempre `false` en la vista del autor). */
  completed: boolean;
}

/** Sesión o plan listo para pintar. */
export interface TrainingSessionView {
  id: string;
  title: string;
  description: string | null;
  /** Día sugerido (0 = lunes … 6 = domingo). */
  weekday: number | null;
  status: TrainingStatus;
  publishAt: Date | null;
  ownerType: TrainingOrigin;
  author: TrainingAuthor;
  /** Suma de la duración de sus ejercicios (los que no la tienen no suman). */
  totalMinutes: number;
  items: TrainingSessionItemView[];
  /** Ejercicios ya completados por el jugador. */
  completedCount: number;
}

/** Condición Prisma de las sesiones visibles para una audiencia. */
export function sessionVisibilityWhere(audience: PlayerTrainingAudience, now: Date = new Date()) {
  return { AND: [...publishedConditions(now), { OR: ownerTypeConditions(audience) }] };
}

/** Suma de la duración de los ejercicios de una sesión. */
export function sessionTotalMinutes(items: { durationMinutes: number | null }[]): number {
  return items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
}

/** Sesiones troceadas por origen, igual que las tarjetas de contenido. */
export function splitTrainingSessions(sessions: TrainingSessionView[]) {
  return {
    general: sessions.filter((session) => session.ownerType === 'GENERAL'),
    coach: sessions.filter((session) => session.ownerType === 'COACH'),
    club: sessions.filter((session) => session.ownerType === 'CLUB'),
  };
}

/** Fila de `TrainingSession` con sus items y su autor. */
interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  weekday: number | null;
  ownerType: string;
  status: string;
  publishAt: Date | null;
  coach: { id: string; clubName: string | null; user: { name: string | null } } | null;
  club: { id: string; name: string } | null;
  items: {
    id: string;
    contentId: string;
    notes: string | null;
    content: {
      id: string;
      title: string;
      category: string;
      durationMinutes: number | null;
      series: number | null;
      reps: string | null;
      restSeconds: number | null;
    };
  }[];
}

/** `include` compartido por las consultas de sesiones. */
const SESSION_INCLUDE = {
  items: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      contentId: true,
      notes: true,
      content: {
        select: {
          id: true,
          title: true,
          category: true,
          durationMinutes: true,
          series: true,
          reps: true,
          restSeconds: true,
        },
      },
    },
  },
  coach: { select: { id: true, clubName: true, user: { select: { name: true } } } },
  club: { select: { id: true, name: true } },
} as const;

/** Convierte una fila de Prisma en la sesión que pinta la vista. */
function mapSessionRow(row: SessionRow, completedIds: Set<string>): TrainingSessionView {
  const items: TrainingSessionItemView[] = row.items.map((item) => ({
    id: item.id,
    contentId: item.content.id,
    title: item.content.title,
    category: item.content.category,
    durationMinutes: item.content.durationMinutes,
    workload: trainingWorkloadLabel(item.content),
    notes: item.notes,
    completed: completedIds.has(item.content.id),
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    weekday: row.weekday,
    status: row.status as TrainingStatus,
    publishAt: row.publishAt,
    ownerType: row.ownerType as TrainingOrigin,
    author: authorOf(row),
    totalMinutes: sessionTotalMinutes(items),
    items,
    completedCount: items.filter((item) => item.completed).length,
  };
}

/** Sesiones publicadas (y borradores) de un autor, ordenadas por día. */
export async function listAuthoredTrainingSessions(
  owner: { coachId: string } | { clubId: string }
): Promise<TrainingSessionView[]> {
  const rows = await prisma.trainingSession.findMany({
    where: 'coachId' in owner ? { coachId: owner.coachId } : { clubId: owner.clubId },
    orderBy: [{ weekday: 'asc' }, { createdAt: 'asc' }],
    include: SESSION_INCLUDE,
  });

  return rows.map((row) => mapSessionRow(row, new Set()));
}

/** Una sesión propia por id (para su página de edición). */
export async function findAuthoredTrainingSession(
  owner: { coachId: string } | { clubId: string },
  sessionId: string
): Promise<TrainingSessionView | null> {
  const row = await prisma.trainingSession.findFirst({
    where: {
      id: sessionId,
      ...('coachId' in owner ? { coachId: owner.coachId } : { clubId: owner.clubId }),
    },
    include: SESSION_INCLUDE,
  });

  return row ? mapSessionRow(row, new Set()) : null;
}

/**
 * Sesiones visibles para un jugador, con lo que ya ha completado de cada una. Se
 * usa en la pestaña «Weekly plan» y en el detalle de una sesión.
 */
export async function listPlayerTrainingSessions(
  userId: string
): Promise<{ audience: PlayerTrainingAudience; sessions: TrainingSessionView[] }> {
  const audience = await playerTrainingAudience(userId);
  const rows = await prisma.trainingSession.findMany({
    where: sessionVisibilityWhere(audience),
    orderBy: [{ weekday: 'asc' }, { createdAt: 'asc' }],
    include: SESSION_INCLUDE,
  });

  const completedIds = await completedContentIds(audience.playerId, rows);
  return { audience, sessions: rows.map((row) => mapSessionRow(row, completedIds)) };
}

/** Una sesión visible para el jugador (`null` si no le llega). */
export async function findPlayerTrainingSession(
  userId: string,
  sessionId: string
): Promise<TrainingSessionView | null> {
  const audience = await playerTrainingAudience(userId);
  const row = await prisma.trainingSession.findFirst({
    where: { id: sessionId, ...sessionVisibilityWhere(audience) },
    include: SESSION_INCLUDE,
  });
  if (!row) return null;

  const completedIds = await completedContentIds(audience.playerId, [row]);
  return mapSessionRow(row, completedIds);
}

/** Contenido completado por el jugador entre los ejercicios de esas sesiones. */
async function completedContentIds(
  playerId: string | null,
  rows: { items: { contentId: string }[] }[]
): Promise<Set<string>> {
  if (!playerId) return new Set();

  const contentIds = [...new Set(rows.flatMap((row) => row.items.map((item) => item.contentId)))];
  if (contentIds.length === 0) return new Set();

  const progress = await prisma.trainingProgress.findMany({
    where: { playerId, contentId: { in: contentIds }, completedAt: { not: null } },
    select: { contentId: true },
  });

  return new Set(progress.map((entry) => entry.contentId));
}
