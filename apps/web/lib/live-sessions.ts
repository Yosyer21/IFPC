import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';

/** Roles de contrato que cuentan como "estar en el club". */
const ACTIVE_CONTRACT_STATUSES = ['SIGNED', 'ACTIVE'];

/**
 * Anuncia un live en Discovery: crea un post enlazado (`liveSessionId`) para que
 * aparezca en el feed con el enlace a la sesión. No hace nada sin sesión.
 */
export async function announceLiveInDiscovery(live: {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
}): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const when = live.startsAt.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });

  const body = [
    `Live session: ${live.title}`,
    live.description,
    `Starts ${when} (UTC). Open the post to join.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  await prisma.post.create({
    data: {
      authorId: session.user.id,
      type: 'ANNOUNCEMENT',
      status: 'PUBLISHED',
      title: live.title,
      body,
      linkUrl: `/dashboard/live-sessions/${live.id}`,
      liveSessionId: live.id,
      tags: ['live'],
    },
  });
}

/**
 * Usuarios que "pertenecen" a un club: el propietario, el staff y los jugadores
 * con contrato firmado/activo. Es la audiencia de un live con `visibility = CLUB`.
 */
export async function clubMemberUserIds(clubId: string): Promise<Set<string>> {
  const [club, staff, contracts] = await Promise.all([
    prisma.club.findUnique({ where: { id: clubId }, select: { userId: true } }),
    prisma.clubStaff.findMany({ where: { clubId }, select: { userId: true } }),
    prisma.contract.findMany({
      where: { clubId, status: { in: ACTIVE_CONTRACT_STATUSES } },
      select: { player: { select: { userId: true } } },
    }),
  ]);

  const ids = new Set<string>();
  if (club?.userId) ids.add(club.userId);
  for (const member of staff) ids.add(member.userId);
  for (const contract of contracts) {
    if (contract.player?.userId) ids.add(contract.player.userId);
  }
  return ids;
}

/** Clubes a los que pertenece un usuario (propietario, staff o jugador con contrato). */
export async function userClubIds(userId: string): Promise<string[]> {
  const [owned, staff, player] = await Promise.all([
    prisma.club.findMany({ where: { userId }, select: { id: true } }),
    prisma.clubStaff.findMany({ where: { userId }, select: { clubId: true } }),
    prisma.player.findUnique({ where: { userId }, select: { id: true } }),
  ]);

  const ids = new Set<string>();
  for (const club of owned) ids.add(club.id);
  for (const member of staff) ids.add(member.clubId);

  if (player) {
    const contracts = await prisma.contract.findMany({
      where: { playerId: player.id, status: { in: ACTIVE_CONTRACT_STATUSES } },
      select: { clubId: true },
    });
    for (const contract of contracts) ids.add(contract.clubId);
  }

  return [...ids];
}

interface SessionVisibility {
  playerId: string | null;
  coachId: string | null;
  clubId: string | null;
  visibility: string;
}

/**
 * ¿Puede el usuario ver esta sesión?
 * - Admin: siempre.
 * - 1:1 (con `playerId`): solo ese jugador y el coach asignado.
 * - Pública: cualquiera.
 * - De club: solo miembros del club.
 */
export async function canViewLiveSession(
  user: { id: string; role: string },
  session: SessionVisibility
): Promise<boolean> {
  if (user.role === 'ADMIN') return true;

  if (session.playerId) {
    const [player, coach] = await Promise.all([
      prisma.player.findUnique({ where: { userId: user.id }, select: { id: true } }),
      prisma.coach.findUnique({ where: { userId: user.id }, select: { id: true } }),
    ]);
    return player?.id === session.playerId || (!!session.coachId && coach?.id === session.coachId);
  }

  if (session.visibility === 'PUBLIC') return true;

  // Sesión de grupo no pública: la ve el coach anfitrión y los miembros del club.
  if (session.coachId) {
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (coach?.id === session.coachId) return true;
  }
  if (session.clubId) return (await clubMemberUserIds(session.clubId)).has(user.id);
  return false;
}
