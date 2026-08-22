import { prisma } from '@ifpc/database';

async function main() {
  const counts = {
    users: await prisma.user.count(),
    players: await prisma.player.count(),
    clubs: await prisma.club.count(),
    opportunities: await prisma.opportunity.count(),
    submissions: await prisma.submission.count(),
    contracts: await prisma.contract.count(),
  };
  console.log('Conexión correcta. Conteos:', JSON.stringify(counts, null, 2));
}

main()
  .catch((error) => {
    console.error('Error de conexión:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
