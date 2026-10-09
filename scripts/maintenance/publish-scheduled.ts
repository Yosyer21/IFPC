// Publica los borradores programados cuya fecha ya pasó (pensado para cron).
// Uso:  pnpm scripts:publish-scheduled
import { prisma } from '@ifpc/database';
import { publishDuePosts } from '../../apps/web/lib/discovery-scheduler';

async function main() {
  const published = await publishDuePosts();
  console.log(
    published.length === 0
      ? 'No había publicaciones programadas pendientes.'
      : `Publicadas ${published.length}: ${published.map((post) => post.id).join(', ')}`
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
