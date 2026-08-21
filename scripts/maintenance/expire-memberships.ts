import { prisma } from '@future-buller/database';

async function main() {
  const result = await prisma.membership.updateMany({
    where: {
      endsAt: { lt: new Date() },
      status: { in: ['PENDING', 'PAID'] },
    },
    data: { status: 'FAILED' },
  });
  console.log(`Membresías expiradas: ${result.count}`);
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
