import { prisma } from '@ifpc/database';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}

/**
 * Crea una notificación de forma síncrona y fiable.
 *
 * Integración worker: el payload es idéntico al del job `notification` de
 * apps/worker (send-notification). En producción se encolará vía BullMQ
 * (notification.queue) para desacoplar el envío; en dev se inserta directo
 * para no depender de Redis.
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
