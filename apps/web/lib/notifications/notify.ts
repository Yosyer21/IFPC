import { prisma } from '@ifpc/database';
import { sendNotificationEmail } from '../email/resend';
import {
  DEFAULT_PREFERENCES,
  mergePreferences,
  wantsEmail,
  wantsInApp,
  type NotificationPreferences,
} from './preferences';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}

/** Ventana en la que los avisos del mismo tipo y destino se agrupan. */
export const NOTIFICATION_GROUP_WINDOW_HOURS = 24;

/** Preferencias del usuario; si la lectura falla, se avisa como siempre. */
async function safePreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const rows = await prisma.notificationPreference.findMany({
      where: { userId },
      select: { category: true, inApp: true, email: true },
    });
    return mergePreferences(rows);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Enlace absoluto para el email (los avisos guardan rutas internas). */
function absoluteUrl(link?: string | null): string | null {
  if (!link) return null;
  if (/^https?:\/\//.test(link)) return link;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${appUrl}${link.startsWith('/') ? '' : '/'}${link}`;
}

/**
 * Creates a notification synchronously and reliably.
 *
 * Respeta las preferencias del usuario (Ajustes → Notifications): si silenció la
 * categoría no se guarda nada, y si tiene el email activo se manda además una
 * copia a su dirección **verificada**. Los correos de seguridad (verificación y
 * recuperación de contraseña) no pasan por aquí: no se pueden desactivar.
 *
 * Worker integration: the payload is identical to the `notification` job in
 * apps/worker (send-notification). In production it will be queued via BullMQ
 * (notification.queue) to decouple the sending; in dev it is inserted directly
 * so it does not depend on Redis.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  const preferences = await safePreferences(input.userId);
  if (!wantsInApp(preferences, input.type)) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
    },
  });

  if (!wantsEmail(preferences, input.type)) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true, emailVerified: true },
    });
    // Sin dirección verificada no se manda la copia por email.
    if (!user?.emailVerified) return;

    await sendNotificationEmail({
      to: user.email,
      name: user.name,
      title: input.title,
      message: input.message,
      url: absoluteUrl(input.link),
    });
  } catch (error) {
    // La copia por email nunca debe romper el aviso interno.
    console.error('[notify] no se pudo enviar la copia por email', error);
  }
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
