import { prisma } from '@ifpc/database';
import { CATEGORY_LABELS } from './labels';

/** Media de evaluations en una category de desarrollo (`Evaluation.category`). */
export interface PlayerStatsCategory {
  category: string;
  label: string;
  average: number;
  count: number;
}

export interface PlayerStats {
  /** Media global sobre 10 (una decimal) o `null` si aún no hay evaluations. */
  overall: number | null;
  evaluations: number;
  categories: PlayerStatsCategory[];
  career: {
    /** Registros de trayectoria (club + season). */
    entries: number;
    /** Temporadas distintas. */
    seasons: number;
    appearances: number;
    goals: number;
    assists: number;
  };
  videos: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Stats deportivas de un player para su perfil: media global y por
 * category, totals de trayectoria y vídeos.
 *
 * Solo datos deportivos: quién view el perfil no sale de aquí (eso es privado
 * del dueño y vive en `profile-views.ts`).
 */
export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const [groups, evaluations, career, seasons, videos] = await Promise.all([
    prisma.evaluation.groupBy({
      by: ['category'],
      where: { playerId },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.evaluation.count({ where: { playerId } }),
    prisma.careerEntry.aggregate({
      where: { playerId },
      _count: { _all: true },
      _sum: { appearances: true, goals: true, assists: true },
    }),
    prisma.careerEntry.findMany({
      where: { playerId },
      select: { season: true },
      distinct: ['season'],
    }),
    prisma.video.count({ where: { playerId } }),
  ]);

  const categories = groups
    .map((group) => ({
      category: group.category,
      label: CATEGORY_LABELS[group.category] ?? group.category,
      average: round1(group._avg.score ?? 0),
      count: group._count._all,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.average - a.average);

  // La media global es la de todas las evaluations: ponderar las medias por su
  // número de evaluations da exactamente lo mismo sin traerse las filas.
  const overall = evaluations
    ? round1(categories.reduce((sum, entry) => sum + entry.average * entry.count, 0) / evaluations)
    : null;

  return {
    overall,
    evaluations,
    categories,
    career: {
      entries: career._count._all,
      seasons: seasons.length,
      appearances: career._sum.appearances ?? 0,
      goals: career._sum.goals ?? 0,
      assists: career._sum.assists ?? 0,
    },
    videos,
  };
}
