// Publica los borradores programados cuya fecha ya pasó (pensado para cron).
// Uso:  pnpm scripts:publish-scheduled
import { prisma } from '@ifpc/database';
import { publishDuePosts } from '../../apps/web/lib/discovery-scheduler';
import {
  publishDueTrainingContent,
  publishDueTrainingSessions,
} from '../../apps/web/lib/training-scheduler';

async function main() {
  const published = await publishDuePosts();
  console.log(
    published.length === 0
      ? 'No había publicaciones programadas pendientes.'
      : `Publicadas ${published.length}: ${published.map((post) => post.id).join(', ')}`
  );

  // Contenido programado del Football Center: aquí solo se avisa a los jugadores
  // (el contenido se ve solo al llegar su fecha).
  const training = await publishDueTrainingContent();
  console.log(
    training.length === 0
      ? 'No había contenido de formación programado pendiente.'
      : `Avisado el contenido de formación ${training.map((item) => item.id).join(', ')}`
  );

  const sessions = await publishDueTrainingSessions();
  console.log(
    sessions.length === 0
      ? 'No había sesiones de formación programadas pendientes.'
      : `Avisadas las sesiones de formación ${sessions.map((item) => item.id).join(', ')}`
  );

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
