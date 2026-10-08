import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { PROFILE_VIEWER_ROLES } from '@ifpc/config';

/** Campos de `ProfileView` necesarios para agregar las métricas. */
export interface ProfileViewRow {
  viewerRole: string;
  viewCount: number;
  firstViewedAt: Date;
  lastViewedAt: Date;
}

export interface ProfileViewStats {
  /** Visitantes únicos. */
  viewers: number;
  /** Visitas totales (incluye repetidas del mismo visitante). */
  views: number;
  /** Visitantes que han llegado por primera vez en los últimos 7 días. */
  newThisWeek: number;
  byRole: { role: string; viewers: number }[];
}

/**
 * Agrega las visitas al perfil: visitantes únicos, visitas totales, nuevos de la
 * última semana y desglose por rol (de mayor a menor).
 */
export function summarizeProfileViews(
  rows: ProfileViewRow[],
  now: Date = new Date()
): ProfileViewStats {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const byRole = new Map<string, number>();

  for (const row of rows) {
    byRole.set(row.viewerRole, (byRole.get(row.viewerRole) ?? 0) + 1);
  }

  return {
    viewers: rows.length,
    views: rows.reduce((sum, row) => sum + row.viewCount, 0),
    newThisWeek: rows.filter((row) => row.firstViewedAt.getTime() >= weekAgo).length,
    byRole: [...byRole.entries()]
      .map(([role, viewers]) => ({ role, viewers }))
      .sort((a, b) => b.viewers - a.viewers),
  };
}

/** Suma una visita al registro del visitante (un registro por jugador + visitante). */
export async function recordProfileView(input: {
  playerId: string;
  viewerUserId: string;
  viewerRole: string;
}): Promise<void> {
  try {
    await prisma.profileView.upsert({
      where: {
        playerId_viewerUserId: { playerId: input.playerId, viewerUserId: input.viewerUserId },
      },
      update: {
        viewerRole: input.viewerRole,
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
      create: input,
    });
  } catch {
    // Las métricas nunca deben romper la página del jugador.
  }
}

/**
 * Registra la visita cuando hay sesión de un rol "profesional" distinto del
 * dueño del perfil. Pensado para llamarse al renderizar un perfil de jugador.
 */
export async function trackProfileView(input: {
  playerId: string;
  ownerUserId: string;
}): Promise<void> {
  const session = await auth();
  const viewer = session?.user;
  if (!viewer?.id || viewer.id === input.ownerUserId) return;

  const role = viewer.role ?? '';
  if (!PROFILE_VIEWER_ROLES.some((value) => value === role)) return;

  await recordProfileView({
    playerId: input.playerId,
    viewerUserId: viewer.id,
    viewerRole: role,
  });
}

/** Métricas de interés del perfil de un jugador. */
export async function getProfileViewStats(
  playerId: string,
  now: Date = new Date()
): Promise<ProfileViewStats> {
  const rows = await prisma.profileView.findMany({
    where: { playerId },
    orderBy: { lastViewedAt: 'desc' },
    select: { viewerRole: true, viewCount: true, firstViewedAt: true, lastViewedAt: true },
  });
  return summarizeProfileViews(rows, now);
}
