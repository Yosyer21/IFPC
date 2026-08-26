import type { Job } from 'bullmq';
import { prisma } from '@ifpc/database';

export async function expireMemberships(job: Job) {
  const result = await prisma.membership.updateMany({
    where: {
      endsAt: { lt: new Date() },
      status: { in: ['PENDING', 'PAID'] },
    },
    data: { status: 'FAILED' },
  });
  console.log(`[maintenance] memberships expired: ${result.count}`);
  return { expired: result.count };
}
