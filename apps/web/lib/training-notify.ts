import { prisma } from '@ifpc/database';
import { notifyUser } from '@/lib/notifications/notify';

/** Estados de contrato que cuentan como «estar en el club» (igual que los live de club). */
const ACTIVE_CONTRACT_STATUSES = ['SIGNED', 'ACTIVE'];

/** Contenido recién publicado, con lo mínimo para saber a quién avisar. */
export interface PublishedTrainingContent {
  id: string;
  title: string;
  ownerType: string;
  coachId: string | null;
  clubId: string | null;
}

/**
 * IDs de usuario de los jugadores que verán este contenido: los vinculados al
 * coach (`CoachPlayer`) o con contrato firmado/activo en el club. El contenido
 * general no avisa a nadie: es abierto y no tiene audiencia concreta.
 */
export async function trainingAudienceUserIds(
  content: Pick<PublishedTrainingContent, 'ownerType' | 'coachId' | 'clubId'>
): Promise<string[]> {
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

/** Aviso que recibe cada jugador (queda en su bandeja con enlace al contenido). */
export function trainingNotification(
  content: Pick<PublishedTrainingContent, 'id' | 'title' | 'ownerType'>
): { title: string; message: string; link: string } {
  const origin = content.ownerType === 'CLUB' ? 'your club' : 'your coach';
  return {
    title: `New training from ${origin}`,
    message: content.title,
    link: `/dashboard/player/training/${content.id}`,
  };
}

/**
 * Avisa a la audiencia de que hay contenido nuevo. Devuelve cuántos jugadores se
 * avisaron para poder informarlo en el script de publicación programada.
 */
export async function notifyTrainingAudience(content: PublishedTrainingContent): Promise<number> {
  const userIds = await trainingAudienceUserIds(content);
  if (userIds.length === 0) return 0;

  const { title, message, link } = trainingNotification(content);
  for (const userId of userIds) {
    await notifyUser({ userId, type: 'training', title, message, link });
  }
  return userIds.length;
}
