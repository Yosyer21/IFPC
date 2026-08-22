import type { Job } from 'bullmq';
import { prisma } from '@ifpc/database';

export interface GenerateReportJobData {
  playerId: string;
  reportType: 'player' | 'scouting';
}

export async function generatePlayerReport(job: Job<GenerateReportJobData>) {
  const { playerId, reportType } = job.data;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      videos: true,
      evaluations: true,
      goals: true,
      submissions: true,
      pathway: true,
    },
  });
  if (!player) {
    throw new Error(`Jugador ${playerId} no encontrado`);
  }

  const averageScore = player.evaluations.length
    ? Math.round(
        (player.evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) /
          player.evaluations.length) *
          10
      ) / 10
    : null;

  const report = {
    playerId,
    reportType,
    generatedAt: new Date().toISOString(),
    fullName: `${player.firstName} ${player.lastName}`,
    position: player.position,
    videos: player.videos.length,
    evaluations: player.evaluations.length,
    averageScore,
    activeGoals: player.goals.filter((goal) => goal.status !== 'completed').length,
    submissions: player.submissions.length,
    pathway: player.pathway?.title ?? null,
  };

  console.log(`[report] ${reportType} generado para ${playerId}`, JSON.stringify(report));
  return report;
}
