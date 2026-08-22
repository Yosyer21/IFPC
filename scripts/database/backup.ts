import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@ifpc/database';

async function main() {
  const [users, players, clubs, opportunities, submissions, trials, contracts] =
    await Promise.all([
      prisma.user.findMany(),
      prisma.player.findMany(),
      prisma.club.findMany(),
      prisma.opportunity.findMany(),
      prisma.submission.findMany(),
      prisma.trial.findMany(),
      prisma.contract.findMany(),
    ]);

  const backup = {
    generatedAt: new Date().toISOString(),
    users,
    players,
    clubs,
    opportunities,
    submissions,
    trials,
    contracts,
  };

  const dir = path.resolve('backups');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `backup-${Date.now()}.json`);
  await writeFile(file, JSON.stringify(backup, null, 2));
  console.log(`Backup guardado en ${file}`);
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
