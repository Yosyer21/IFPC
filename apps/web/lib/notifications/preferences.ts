/**
 * Preferencias de avisos del usuario: qué categorías se guardan en la bandeja de
 * la plataforma y cuáles se mandan **también** por email.
 *
 * Las categorías agrupan los tipos que ya genera la plataforma (`post_like`,
 * `post_mention`, `new_follower`, `application`, `training`), de modo que añadir
 * un tipo nuevo no necesita migración: solo tocar esta tabla.
 *
 * Este módulo es **puro** (sin base de datos ni `'use client'`): lo comparten el
 * formulario de Ajustes, las acciones y `notify.ts`, que es quien lee las filas.
 */
export const NOTIFICATION_CATEGORIES = [
  {
    id: 'social',
    label: 'Likes, comments and mentions',
    description:
      'When someone likes or comments on your posts, mentions you or starts following you.',
    types: ['post_like', 'post_mention', 'new_follower'],
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    description: 'Clubs, scouts and agents answering the applications you send them.',
    types: ['application'],
  },
  {
    id: 'training',
    label: 'Training and live sessions',
    description: 'Reminders, invitations and new content in the Football Center.',
    types: ['training'],
  },
] as const;

export type NotificationCategoryId = (typeof NOTIFICATION_CATEGORIES)[number]['id'];

export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
}

export type NotificationPreferences = Record<NotificationCategoryId, ChannelPreference>;

/** Por defecto: todo dentro de la plataforma, y el email se activa a mano. */
export const DEFAULT_PREFERENCES: NotificationPreferences = {
  social: { inApp: true, email: false },
  opportunities: { inApp: true, email: false },
  training: { inApp: true, email: false },
};

/** ¿Es una categoría configurable? (las guardadas podrían venir de otra versión). */
export function isNotificationCategory(value: string): value is NotificationCategoryId {
  return NOTIFICATION_CATEGORIES.some((category) => category.id === value);
}

/**
 * Tipos antiguos que siguen guardados en la base y pertenecen a una categoría
 * conocida. Los avisos no se reescriben: se reconocen al leerlos, igual que se
 * hace con las categorías de evaluación heredadas.
 */
const LEGACY_TYPE_CATEGORY: Record<string, NotificationCategoryId> = {
  opportunity: 'opportunities',
};

/** Categoría a la que pertenece un tipo de aviso, o `null` si no es configurable. */
export function notificationCategory(type: string): NotificationCategoryId | null {
  const legacy = LEGACY_TYPE_CATEGORY[type];
  if (legacy) return legacy;

  const found = NOTIFICATION_CATEGORIES.find((category) =>
    (category.types as readonly string[]).includes(type)
  );
  return found ? found.id : null;
}

/** Aplica las filas guardadas sobre los valores por defecto. */
export function mergePreferences(
  rows: readonly { category: string; inApp: boolean; email: boolean }[]
): NotificationPreferences {
  const preferences: NotificationPreferences = { ...DEFAULT_PREFERENCES };

  for (const row of rows) {
    if (!isNotificationCategory(row.category)) continue;
    preferences[row.category] = { inApp: row.inApp, email: row.email };
  }

  return preferences;
}

/** ¿Se guarda este aviso en la bandeja? (los tipos desconocidos siempre sí) */
export function wantsInApp(preferences: NotificationPreferences, type: string): boolean {
  const category = notificationCategory(type);
  return category ? preferences[category].inApp : true;
}

/** ¿Se manda además por email? (los tipos desconocidos nunca) */
export function wantsEmail(preferences: NotificationPreferences, type: string): boolean {
  const category = notificationCategory(type);
  return category ? preferences[category].email : false;
}

/**
 * Lee el formulario de preferencias: un checkbox `inApp:<categoría>` y otro
 * `email:<categoría>` por fila. Las categorías desconocidas se ignoran.
 */
export function preferencesFromForm(
  formData: FormData
): { category: NotificationCategoryId; inApp: boolean; email: boolean }[] {
  return NOTIFICATION_CATEGORIES.map((category) => ({
    category: category.id,
    inApp: formData.get(`inApp:${category.id}`) === 'on',
    email: formData.get(`email:${category.id}`) === 'on',
  }));
}

/**
 * Categoría especial del **resumen semanal**: no es un aviso de la bandeja, solo
 * un email de resumen. Se guarda en la misma tabla (`NotificationPreference`) con
 * `inApp` siempre a `false`.
 */
export const WEEKLY_DIGEST_CATEGORY = 'weekly_digest';

/** ¿Ha pedido el resumen semanal por email? */
export function wantsWeeklyDigest(rows: readonly { category: string; email: boolean }[]): boolean {
  return rows.some((row) => row.category === WEEKLY_DIGEST_CATEGORY && row.email);
}

/** Casilla del resumen semanal en el formulario de Ajustes. */
export function weeklyDigestFromForm(formData: FormData): boolean {
  return formData.get(`email:${WEEKLY_DIGEST_CATEGORY}`) === 'on';
}
