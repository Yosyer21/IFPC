'use server';

import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import {
  WEEKLY_DIGEST_CATEGORY,
  preferencesFromForm,
  weeklyDigestFromForm,
} from '@/lib/notifications/preferences';
import type { ActionState } from './auth';

/**
 * Guarda qué categorías de aviso se ven dentro de la plataforma y cuáles se
 * mandan también por email, además del resumen semanal. Se guarda una fila por
 * categoría (`upsert`), así que el mismo formulario vale para cualquier
 * combinación.
 */
export async function saveNotificationPreferencesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const userId = session.user.id;
  const digest = weeklyDigestFromForm(formData);

  try {
    await prisma.$transaction([
      ...preferencesFromForm(formData).map((row) =>
        prisma.notificationPreference.upsert({
          where: { userId_category: { userId, category: row.category } },
          create: { userId, ...row },
          update: { inApp: row.inApp, email: row.email },
        })
      ),
      // El resumen semanal no es un aviso de la bandeja: solo canal email.
      prisma.notificationPreference.upsert({
        where: { userId_category: { userId, category: WEEKLY_DIGEST_CATEGORY } },
        create: { userId, category: WEEKLY_DIGEST_CATEGORY, inApp: false, email: digest },
        update: { inApp: false, email: digest },
      }),
    ]);
  } catch {
    return { error: 'The preferences could not be saved.' };
  }

  return { success: 'Notification preferences saved.' };
}
