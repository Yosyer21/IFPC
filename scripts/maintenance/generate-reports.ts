import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@future-buller/database';

async function main() {
  const players = await prisma.player.findMany({
    include: {
      _count: { select: { videos: true, evaluations: true, submissions: true } },
      user: true,
    },
  });

  const report = players.map((player) => ({
    id: player.id,
    name: `${player.firstName} ${player.lastName}`,
    email: player.user.email,
    position: player.position,
    status: player.status,
    videos: player._count.videos,
    evaluations: player._count.evaluations,
    submissions: player._count.submissions,
  }));

  const dir = path.resolve('reports');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `players-${Date.now()}.json`);
  await writeFile(file, JSON.stringify(report, null, 2));
  console.log(`Informe de ${report.length} jugadores en ${file}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
