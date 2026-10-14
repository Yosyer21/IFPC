import { prisma } from '@ifpc/database';
import type { TrainingStatus } from '@ifpc/config';
import { notifyUser } from '@/lib/notifications/notify';
import { ACTIVE_CONTRACT_STATUSES, shouldNotifyOnSave } from '@/lib/training';

/** Contenido recién publicado, con lo mínimo para saber a quién avisar. */
export interface PublishedTrainingContent {
  id: string;
  title: string;
  ownerType: string;
  coachId: string | null;
  clubId: string | null;
  /** `AUDIENCE` (todos) o `SELECTED` (solo los elegidos). */
  scope?: string;
  /** Jugadores elegidos cuando `scope = SELECTED`. */
  targetPlayerIds?: string[];
}

/**
 * IDs de usuario de los jugadores que verán esto: si va dirigido a jugadores
 * concretos, solo ellos; si no, los vinculados al coach (`CoachPlayer`) o con
 * contrato firmado/activo en el club. El contenido general no avisa a nadie: es
 * abierto y no tiene audiencia concreta.
 */
export async function trainingAudienceUserIds(
  content: Pick<PublishedTrainingContent, 'ownerType' | 'coachId' | 'clubId'> & {
    scope?: string;
    targetPlayerIds?: string[];
  }
): Promise<string[]> {
  if (content.scope === 'SELECTED') {
    const playerIds = content.targetPlayerIds ?? [];
    if (playerIds.length === 0) return [];

    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { userId: true },
    });
    return [...new Set(players.map((player) => player.userId))];
  }

  if (content.ownerType === 'COACH' && content.coachId) {
    const links = await prisma.coachPlayer.findMany({
      where: { coachId: content.coachId },
      select: { player: { select: { userId: true } } },
    });
    return [...new Set(links.map((link) => link.player.userId))];
  }

  if (content.ownerType === 'CLUB' && content.clubId) {
    const contracts = await prisma.contract.findMany({
      where: { clubId: content.clubId, status: { in: ACTIVE_CONTRACT_STATUSES } },
      select: { player: { select: { userId: true } } },
    });
    return [...new Set(contracts.map((contract) => contract.player.userId))];
  }

  return [];
}

/** Qué se acaba de publicar: cambia el texto y el destino del aviso. */
export type TrainingNotificationKind = 'content' | 'session';

/** Aviso que recibe cada jugador (queda en su bandeja con enlace al destino). El
 * campo va aparte del `kind` del contenido (`COURSE`/`EXERCISE`) para no chocar.
 */
export function trainingNotification(
  target: Pick<PublishedTrainingContent, 'id' | 'title' | 'ownerType'> & {
    notificationKind?: TrainingNotificationKind;
  }
): { title: string; message: string; link: string } {
  const kind = target.notificationKind ?? 'content';
  const origin = target.ownerType === 'CLUB' ? 'your club' : 'your coach';

  return {
    title: `New ${kind === 'session' ? 'training session' : 'training'} from ${origin}`,
    message: target.title,
    link:
      kind === 'session'
        ? `/dashboard/player/training/sessions/${target.id}`
        : `/dashboard/player/training/${target.id}`,
  };
}

/**
 * Avisa a la audiencia de que hay contenido nuevo. Devuelve cuántos jugadores se
 * avisaron para poder informarlo en el script de publicación programada.
 */
export async function notifyTrainingAudience(
  content: PublishedTrainingContent & { notificationKind?: TrainingNotificationKind }
): Promise<number> {
  const userIds = await trainingAudienceUserIds(content);
  if (userIds.length === 0) return 0;

  const { title, message, link } = trainingNotification(content);
  for (const userId of userIds) {
    await notifyUser({ userId, type: 'training', title, message, link });
  }
  return userIds.length;
}

/**
 * Avisa a la audiencia cuando algo **pasa** a ser visible (borrador o programado →
 * publicado ya); nunca repite el aviso al editar algo que ya se veía. Es
 * best-effort: si falla, lo publicado sigue publicado. Lo comparten el contenido y
 * las sesiones para que la regla del aviso no pueda divergir.
 */
export async function notifyIfNewlyVisible(
  before: { status: TrainingStatus; publishAt: Date | null } | null,
  published: PublishedTrainingContent & {
    notificationKind?: TrainingNotificationKind;
    status: TrainingStatus;
    publishAt: Date | null;
  }
): Promise<void> {
  if (!shouldNotifyOnSave(before, { status: published.status, publishAt: published.publishAt })) {
    return;
  }

  try {
    await notifyTrainingAudience(published);
  } catch {
    // Sin aviso, pero queda publicado igualmente.
  }
}
