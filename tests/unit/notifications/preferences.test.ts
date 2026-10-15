import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  NOTIFICATION_CATEGORIES,
  WEEKLY_DIGEST_CATEGORY,
  mergePreferences,
  notificationCategory,
  preferencesFromForm,
  wantsEmail,
  wantsInApp,
  wantsWeeklyDigest,
  weeklyDigestFromForm,
} from '@/lib/notifications/preferences';
import { DIGEST_MAX_ITEMS_PER_GROUP, buildDigest } from '@/lib/notifications/digest';

describe('categorías de avisos', () => {
  it('agrupa los tipos que genera la plataforma', () => {
    expect(notificationCategory('post_like')).toBe('social');
    expect(notificationCategory('post_mention')).toBe('social');
    expect(notificationCategory('new_follower')).toBe('social');
    expect(notificationCategory('application')).toBe('opportunities');
    expect(notificationCategory('training')).toBe('training');
  });

  it('deja fuera los tipos desconocidos', () => {
    expect(notificationCategory('inventado')).toBeNull();
  });

  it('reconoce los tipos antiguos que siguen guardados en la base', () => {
    expect(notificationCategory('opportunity')).toBe('opportunities');
  });

  it('no repite un tipo en dos categorías', () => {
    const types = NOTIFICATION_CATEGORIES.flatMap((category) => [...category.types]);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe('mergePreferences', () => {
  it('sin filas usa los valores por defecto (dentro sí, email no)', () => {
    expect(mergePreferences([])).toEqual(DEFAULT_PREFERENCES);
    expect(DEFAULT_PREFERENCES.social).toEqual({ inApp: true, email: false });
  });

  it('aplica lo guardado y descarta categorías desconocidas', () => {
    const preferences = mergePreferences([
      { category: 'social', inApp: false, email: true },
      { category: 'desconocida', inApp: true, email: true },
    ]);

    expect(preferences.social).toEqual({ inApp: false, email: true });
    expect(preferences.opportunities).toEqual(DEFAULT_PREFERENCES.opportunities);
  });
});

describe('canales', () => {
  const silenciado = mergePreferences([{ category: 'social', inApp: false, email: false }]);

  it('respeta el silencio dentro de la plataforma', () => {
    expect(wantsInApp(silenciado, 'post_like')).toBe(false);
    expect(wantsEmail(silenciado, 'post_like')).toBe(false);
    expect(wantsInApp(silenciado, 'application')).toBe(true);
  });

  it('los tipos no configurables se guardan igual y nunca se mandan por email', () => {
    expect(wantsInApp(silenciado, 'tipo_raro')).toBe(true);
    expect(wantsEmail(silenciado, 'tipo_raro')).toBe(false);
  });
});

describe('preferencesFromForm', () => {
  it('lee una casilla por canal y categoría', () => {
    const formData = new FormData();
    formData.set('inApp:social', 'on');
    formData.set('email:social', 'on');
    formData.set('inApp:training', 'on');

    const rows = preferencesFromForm(formData);
    expect(rows).toContainEqual({ category: 'social', inApp: true, email: true });
    expect(rows).toContainEqual({ category: 'opportunities', inApp: false, email: false });
    expect(rows).toContainEqual({ category: 'training', inApp: true, email: false });
  });
});

describe('resumen semanal', () => {
  it('se activa con su categoría y el canal email', () => {
    expect(wantsWeeklyDigest([])).toBe(false);
    expect(wantsWeeklyDigest([{ category: WEEKLY_DIGEST_CATEGORY, email: false }])).toBe(false);
    expect(wantsWeeklyDigest([{ category: WEEKLY_DIGEST_CATEGORY, email: true }])).toBe(true);
    expect(wantsWeeklyDigest([{ category: 'social', email: true }])).toBe(false);
  });

  it('lee su casilla del formulario', () => {
    const formData = new FormData();
    expect(weeklyDigestFromForm(formData)).toBe(false);
    formData.set(`email:${WEEKLY_DIGEST_CATEGORY}`, 'on');
    expect(weeklyDigestFromForm(formData)).toBe(true);
  });
});

describe('buildDigest', () => {
  const aviso = (type: string, read = false) => ({
    type,
    title: `Aviso ${type}`,
    message: null,
    link: `/dashboard/player/notifications`,
    read,
    createdAt: new Date(),
  });

  it('agrupa por categoría, cuenta los no leídos y ordena por actividad', () => {
    const digest = buildDigest([
      aviso('post_like'),
      aviso('post_like', true),
      aviso('new_follower'),
      aviso('application'),
    ]);

    expect(digest.total).toBe(4);
    expect(digest.unread).toBe(3);
    expect(digest.groups[0]).toMatchObject({ category: 'social', total: 3, unread: 2 });
    expect(digest.groups[1]).toMatchObject({ category: 'opportunities', total: 1 });
  });

  it('manda los tipos sin categoría al grupo "other"', () => {
    const digest = buildDigest([aviso('tipo_raro')]);
    expect(digest.groups[0]).toMatchObject({ category: 'other', label: 'Other activity' });
  });

  it('limita los títulos listados por grupo', () => {
    const muchos = Array.from({ length: DIGEST_MAX_ITEMS_PER_GROUP + 3 }, () => aviso('post_like'));
    const digest = buildDigest(muchos);

    expect(digest.groups[0].total).toBe(DIGEST_MAX_ITEMS_PER_GROUP + 3);
    expect(digest.groups[0].items).toHaveLength(DIGEST_MAX_ITEMS_PER_GROUP);
  });

  it('sin avisos devuelve un resumen vacío', () => {
    expect(buildDigest([])).toEqual({ total: 0, unread: 0, groups: [] });
  });
});
