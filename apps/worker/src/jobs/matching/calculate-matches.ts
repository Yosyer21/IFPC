import type { Job } from 'bullmq';
import { prisma } from '@future-buller/database';
import { matchScore } from '@future-buller/matching';

export interface CalculateMatchesJobData {
  playerId?: string;
  clubId?: string;
}

export async function calculateMatches(job: Job<CalculateMatchesJobData>) {
  const { playerId, clubId } = job.data;

  const players = playerId
    ? await prisma.player.findMany({ where: { id: playerId } })
    : await prisma.player.findMany({ where: { status: 'AVAILABLE' }, take: 50 });

  const requirements = clubId
    ? await prisma.requirement.findMany({ where: { clubId, status: 'OPEN' } })
    : await prisma.requirement.findMany({ where: { status: 'OPEN' }, take: 50 });

  const results = players
    .map((player) => {
      const best = requirements
        .map((requirement) => ({
          requirementId: requirement.id,
          ...matchScore(
            {
              position: player.position,
              dateOfBirth: player.dateOfBirth,
              nationality: player.nationality,
              competitionLevel: player.competitionLevel,
              status: player.status,
            },
            {
              position: requirement.position,
              ageMin: requirement.ageMin,
              ageMax: requirement.ageMax,
              level: requirement.level,
              country: requirement.country,
            }
          ),
        }))
        .sort((a, b) => b.total - a.total)[0] ?? null;

      return { playerId: player.id, best };
    })
    .filter((entry) => entry.best && entry.best.total >= 60);

  console.log(
    `[matching] ${results.length} coincidencia(s) destacada(s) entre ${players.length} jugador(es) y ${requirements.length} requisito(s)`
  );
  return { computed: results.length };
}
