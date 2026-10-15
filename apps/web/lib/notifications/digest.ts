import {
  NOTIFICATION_CATEGORIES,
  notificationCategory,
  type NotificationCategoryId,
} from './preferences';

/** Cuántos títulos de cada categoría se listan en el email. */
export const DIGEST_MAX_ITEMS_PER_GROUP = 4;

/** Fila mínima de `Notification` que necesita el resumen. */
export interface DigestNotification {
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
}

export interface DigestGroup {
  /** Categoría configurable, o `other` para tipos sin categoría. */
  category: NotificationCategoryId | 'other';
  label: string;
  total: number;
  unread: number;
  items: { title: string; link: string | null }[];
}

export interface Digest {
  total: number;
  unread: number;
  groups: DigestGroup[];
}

/**
 * Resume los avisos de la semana agrupándolos por categoría (los tipos sin
 * categoría caen en `other`). Los grupos van de más a menos actividad y de cada
 * uno se listan solo los primeros títulos, para que el email no se eternice.
 */
export function buildDigest(notifications: readonly DigestNotification[]): Digest {
  const groups = new Map<DigestGroup['category'], DigestGroup>();

  for (const notification of notifications) {
    const category = notificationCategory(notification.type) ?? 'other';
    const label =
      category === 'other'
        ? 'Other activity'
        : (NOTIFICATION_CATEGORIES.find((entry) => entry.id === category)?.label ?? category);

    const group = groups.get(category) ?? {
      category,
      label,
      total: 0,
      unread: 0,
      items: [] as DigestGroup['items'],
    };
    group.total += 1;
    if (!notification.read) group.unread += 1;
    if (group.items.length < DIGEST_MAX_ITEMS_PER_GROUP) {
      group.items.push({ title: notification.title, link: notification.link });
    }
    groups.set(category, group);
  }

  return {
    total: notifications.length,
    unread: notifications.filter((notification) => !notification.read).length,
    groups: [...groups.values()].sort((first, second) => second.total - first.total),
  };
}
