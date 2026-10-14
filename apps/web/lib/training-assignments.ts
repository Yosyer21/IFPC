import { prisma } from '@ifpc/database';
import { isTrainingScope, type TrainingScope } from '@ifpc/config';
import { ACTIVE_CONTRACT_STATUSES, type TrainingAuthorRef } from '@/lib/training';

/**
 * Destinatarios del Football Center: a quién le llega el contenido o la sesión
 * (toda la audiencia o solo los elegidos) y quién lo ha hecho ya, para el panel
 * del autor.
 */

/** Jugador de la audiencia del autor (para elegir destinatarios). */
export interface TrainingPlayerOption {
  playerId: string;
  name: string;
}

/** Jugador con su estado frente a un contenido o sesión. */
export interface TrainingRecipient extends TrainingPlayerOption {
  /** Elegido a mano en vez de recibirlo por ser de toda la audiencia. */
  targeted: boolean;
  /** Cuándo completó el contenido (`null` si sigue pendiente). */
  completedAt: Date | null;
  /** En sesiones: ejercicios de la sesión que ya ha hecho. */
  completedItems: number | null;
  /** En sesiones: ejercicios que tiene la sesión. */
  totalItems: number | null;
}

/** Lo mínimo de un contenido o sesión para saber quién lo recibe. */
interface Targetable {
  id: string;
  coachId: string | null;
  clubId: string | null;
  scope: string;
  targetPlayerIds: string[];
}

/** Nombre visible del jugador. */
export function playerDisplayName(player: { firstName: string; lastName: string }): string {
  return `${player.firstName} ${player.lastName}`.trim();
}

/**
 * Jugadores de la audiencia del autor: los vinculados al coach (`CoachPlayer`) o
 * con contrato firmado/activo en el club, ordenados por nombre.
 */
export async function authorPlayers(owner: TrainingAuthorRef): Promise<TrainingPlayerOption[]> {
  const players = owner.coachId
    ? (
        await prisma.coachPlayer.findMany({
          where: { coachId: owner.coachId },
          select: { player: { select: { id: true, firstName: true, lastName: true } } },
        })
      ).map((link) => link.player)
    : owner.clubId
      ? (
          await prisma.contract.findMany({
            where: { clubId: owner.clubId, status: { in: ACTIVE_CONTRACT_STATUSES } },
            select: { player: { select: { id: true, firstName: true, lastName: true } } },
          })
        ).map((contract) => contract.player)
      : [];

  return players
    .map((player) => ({ playerId: player.id, name: playerDisplayName(player) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** IDs de usuario de esos jugadores (para mandarles un aviso). */
export async function playerUserIds(playerIds: string[]): Promise<string[]> {
  if (playerIds.length === 0) return [];

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { userId: true },
  });
  return [...new Set(players.map((player) => player.userId))];
}

/** Quién recibe un contenido y quién lo ha completado (panel del autor). */
export async function contentRecipients(content: Targetable): Promise<TrainingRecipient[]> {
  const recipients = await recipientsFor(content);
  if (recipients.length === 0) return [];

  const progress = await prisma.trainingProgress.findMany({
    where: { contentId: content.id, playerId: { in: recipients.map((row) => row.playerId) } },
    select: { playerId: true, completedAt: true },
  });
  const completedBy = new Map(progress.map((row) => [row.playerId, row.completedAt]));

  return recipients.map((recipient) => ({
    ...recipient,
    completedAt: completedBy.get(recipient.playerId) ?? null,
  }));
}

/** Igual para una sesión, contando los ejercicios hechos de los que tiene. */
export async function sessionRecipients(
  session: Targetable & { items: { contentId: string }[] }
): Promise<TrainingRecipient[]> {
  const recipients = await recipientsFor(session);
  if (recipients.length === 0) return [];

  const contentIds = session.items.map((item) => item.contentId);
  const progress =
    contentIds.length === 0
      ? []
      : await prisma.trainingProgress.findMany({
          where: {
            playerId: { in: recipients.map((row) => row.playerId) },
            contentId: { in: contentIds },
            completedAt: { not: null },
          },
          select: { playerId: true, contentId: true },
        });

  const doneByPlayer = new Map<string, Set<string>>();
  for (const row of progress) {
    const done = doneByPlayer.get(row.playerId) ?? new Set<string>();
    done.add(row.contentId);
    doneByPlayer.set(row.playerId, done);
  }

  return recipients.map((recipient) => ({
    ...recipient,
    completedItems: doneByPlayer.get(recipient.playerId)?.size ?? 0,
    totalItems: contentIds.length,
  }));
}

/** Audiencia del autor ya filtrada por los elegidos cuando va dirigido. */
async function recipientsFor(source: Targetable): Promise<TrainingRecipient[]> {
  const audience = await authorPlayers({ coachId: source.coachId, clubId: source.clubId });
  const withDefaults = (player: TrainingPlayerOption, targeted: boolean): TrainingRecipient => ({
    ...player,
    targeted,
    completedAt: null,
    completedItems: null,
    totalItems: null,
  });

  if (source.scope !== 'SELECTED') {
    return audience.map((player) => withDefaults(player, false));
  }

  const targets = new Set(source.targetPlayerIds);
  return audience
    .filter((player) => targets.has(player.playerId))
    .map((player) => withDefaults(player, true));
}

/** Jugadores que aún no han completado el contenido (para recordarles). */
export function pendingRecipients(recipients: TrainingRecipient[]): TrainingRecipient[] {
  return recipients.filter((recipient) =>
    recipient.totalItems === null
      ? recipient.completedAt === null
      : recipient.completedItems !== null && recipient.completedItems < recipient.totalItems
  );
}

/** Destinatarios que llegan del formulario. */
export type TrainingAssignment =
  | { scope: 'AUDIENCE'; playerIds: string[] }
  | { scope: 'SELECTED'; playerIds: string[] }
  | { error: string };

/**
 * Lee los destinatarios del formulario. Solo se aceptan jugadores de la audiencia
 * del autor y, si elige «solo algunos», tiene que marcar al menos uno: publicar
 * para nadie sería un error silencioso.
 */
export async function resolveTrainingAssignment(
  formData: FormData,
  owner: TrainingAuthorRef
): Promise<TrainingAssignment> {
  const scope = formData.get('scope');
  if (!isTrainingScope(scope) || scope === 'AUDIENCE') {
    return { scope: 'AUDIENCE', playerIds: [] };
  }

  const allowed = new Set((await authorPlayers(owner)).map((player) => player.playerId));
  const playerIds = formData
    .getAll('playerIds')
    .filter((value): value is string => typeof value === 'string' && allowed.has(value));

  if (playerIds.length === 0) {
    return { error: 'Pick at least one player, or send it to all your players.' };
  }

  return { scope: 'SELECTED', playerIds };
}

/** Destinatarios al **crear**: se escriben de una vez. */
export function targetCreateInput(assignment: { scope: TrainingScope; playerIds: string[] }) {
  return {
    scope: assignment.scope,
    targets: { create: assignment.playerIds.map((playerId) => ({ playerId })) },
  };
}

/** Destinatarios al **editar**: se reemplazan los que hubiera. */
export function targetUpdateInput(assignment: { scope: TrainingScope; playerIds: string[] }) {
  return {
    scope: assignment.scope,
    targets: {
      deleteMany: {},
      create: assignment.playerIds.map((playerId) => ({ playerId })),
    },
  };
}
