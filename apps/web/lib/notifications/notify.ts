import { prisma } from '@ifpc/database';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}

/**
 * Creates a notification synchronously and reliably.
 *
 * Worker integration: the payload is identical to the `notification` job in
 * apps/worker (send-notification). In production it will be queued via BullMQ
 * (notification.queue) to decouple the sending; in dev it is inserted directly
 * so it does not depend on Redis.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
    },
  });
}
