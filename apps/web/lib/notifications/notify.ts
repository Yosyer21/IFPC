import { prisma } from '@ifpc/database';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}

/** Ventana en la que los avisos del mismo tipo y destino se agrupan. */
export const NOTIFICATION_GROUP_WINDOW_HOURS = 24;

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

/**
 * Crea el aviso o lo **agrupa** con el que ya esté pendiente del mismo tipo y
 * destino dentro de la ventana, incrementando su contador en vez de llenar la
 * bandeja con un aviso por interacción ("A 3 personas les gusta…").
 *
 * El `createdAt` del aviso agrupado se actualiza al último evento para que la
 * bandeja quede ordenada por actividad reciente.
 */
export async function notifyGrouped(
  input: NotifyInput & { groupMessage?: (count: number) => string }
): Promise<void> {
  const since = new Date(Date.now() - NOTIFICATION_GROUP_WINDOW_HOURS * 60 * 60 * 1000);

  try {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        link: input.link ?? null,
        read: false,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, count: true },
    });

    if (existing) {
      const count = existing.count + 1;
      await prisma.notification.update({
        where: { id: existing.id },
        data: {
          count,
          message: input.groupMessage ? input.groupMessage(count) : (input.message ?? null),
          createdAt: new Date(),
        },
      });
      return;
    }
  } catch {
    // Si la agrupación falla se cae al aviso simple: nunca se pierde el aviso.
  }

  await notifyUser(input);
}
