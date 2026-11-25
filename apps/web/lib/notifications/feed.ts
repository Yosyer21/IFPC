/**
 * Agrupación de la bandeja de avisos (Today/Earlier + filtros por categoría).
 * Módulo puro, sin Prisma, para poder testearlo y reutilizarlo en la UI.
 */

export const NOTIFICATION_GROUPS = [
  {
    id: 'offers',
    label: 'Offers & bookings',
    types: ['application', 'opportunity', 'trial', 'booking'],
  },
  { id: 'coach', label: 'Coach', types: ['training', 'session'] },
  {
    id: 'social',
    label: 'Social',
    types: ['post_like', 'post_comment', 'post_mention', 'new_follower'],
  },
  { id: 'documents', label: 'Documents', types: ['document'] },
  { id: 'payments', label: 'Payments', types: ['payment'] },
  { id: 'messages', label: 'Messages', types: ['message'] },
  { id: 'account', label: 'Account', types: ['account', 'security'] },
] as const;

export type NotificationGroupId = (typeof NOTIFICATION_GROUPS)[number]['id'];

export const NOTIFICATION_GROUP_LABELS: Record<NotificationGroupId | 'system', string> = {
  offers: 'Offers & bookings',
  coach: 'Coach',
  social: 'Social',
  documents: 'Documents',
  payments: 'Payments',
  messages: 'Messages',
  account: 'Account',
  system: 'System',
};

/** Grupo de un tipo de aviso (`system` si no encaja en ninguno). */
export function notificationGroup(type: string): NotificationGroupId | 'system' {
  const found = NOTIFICATION_GROUPS.find((group) =>
    (group.types as readonly string[]).includes(type)
  );
  return found ? found.id : 'system';
}

/**
 * Separa los avisos en **Today** y **Earlier** comparando por día UTC (el mismo
 * criterio determinista que usa el calendario).
 */
export function groupNotificationsByDay<T extends { createdAt: Date }>(
  items: readonly T[],
  now: Date = new Date()
): { today: T[]; earlier: T[] } {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const today: T[] = [];
  const earlier: T[] = [];
  for (const item of items) {
    if (item.createdAt.getTime() >= start) today.push(item);
    else earlier.push(item);
  }
  return { today, earlier };
}
