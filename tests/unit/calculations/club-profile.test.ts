import { describe, expect, it } from 'vitest';
import {
  CLUB_PROFILE_CHECKLIST,
  CLUB_PROFILE_CHECKLIST_KEYS,
  CLUB_PROFILE_CHECKLIST_POINTS,
  CLUB_PROFILE_TAGS,
  CLUB_PROFILE_TAGS_MAX,
  clubProfileTagLabels,
  profileChecklistScore,
  sanitizeClubProfileTags,
} from '@ifpc/config';
import { clubLocation, clubProfileChecklist } from '@/lib/club';

describe('CLUB_PROFILE_CHECKLIST', () => {
  it('los pesos suman 100 y las claves siguen el orden declarado', () => {
    expect(CLUB_PROFILE_CHECKLIST_POINTS).toBe(100);
    expect(CLUB_PROFILE_CHECKLIST.map((item) => item.key)).toEqual([
      ...CLUB_PROFILE_CHECKLIST_KEYS,
    ]);
    expect(new Set(CLUB_PROFILE_CHECKLIST_KEYS).size).toBe(CLUB_PROFILE_CHECKLIST_KEYS.length);
  });

  it('todos los pasos llevan al área del club', () => {
    for (const item of CLUB_PROFILE_CHECKLIST) {
      expect(item.href.startsWith('/dashboard/club')).toBe(true);
    }
  });
});

describe('sanitizeClubProfileTags', () => {
  it('conserva solo lo conocido y sin duplicados', () => {
    expect(sanitizeClubProfileTags(['TRIALS', 'TRIALS', 'NOPE', 'YOUTH'])).toEqual([
      'TRIALS',
      'YOUTH',
    ]);
  });

  it('corta al máximo permitido', () => {
    const all = [...CLUB_PROFILE_TAGS];
    expect(sanitizeClubProfileTags(all)).toHaveLength(CLUB_PROFILE_TAGS_MAX);
    expect(sanitizeClubProfileTags(all)).toEqual(all.slice(0, CLUB_PROFILE_TAGS_MAX));
  });

  it('acepta basura sin lanzar', () => {
    expect(sanitizeClubProfileTags([])).toEqual([]);
    expect(sanitizeClubProfileTags(['', null, 5, {}])).toEqual([]);
  });
});

describe('clubProfileTagLabels', () => {
  it('traduce los chips y descarta lo desconocido', () => {
    expect(clubProfileTagLabels(['TRIALS', 'NOPE'])).toEqual(['Open trials']);
    expect(clubProfileTagLabels([])).toEqual([]);
  });
});

describe('clubProfileChecklist', () => {
  const base = {
    name: 'CD Demo',
    country: 'Spain',
    city: 'Valencia',
    league: 'LaLiga',
    foundedYear: 1998,
    description: 'Youth academy with a residential programme.',
    headline: 'Youth academy · Valencia',
    logoUrl: '/uploads/club-logos/a.png',
    bannerUrl: '/uploads/club-banners/a.png',
    tags: ['TRIALS'],
    opportunityCount: 2,
    staffCount: 1,
  };

  it('con los datos completos llega al 100%', () => {
    const state = clubProfileChecklist(base);
    expect(state.percent).toBe(100);
    expect(state.completed).toBe(state.total);
    expect(state.next).toBeNull();
  });

  it('el escudo y la portada son dos ítems distintos', () => {
    const state = clubProfileChecklist({ ...base, logoUrl: null, bannerUrl: null });
    expect(state.items.find((item) => item.key === 'logo')?.done).toBe(false);
    expect(state.items.find((item) => item.key === 'banner')?.done).toBe(false);
    expect(state.points).toBe(84);
  });

  it('cuenta las oportunidades publicadas y el cuerpo técnico', () => {
    const empty = clubProfileChecklist({ ...base, opportunityCount: 0, staffCount: 0 });
    expect(empty.items.find((item) => item.key === 'opportunity')?.done).toBe(false);
    expect(empty.items.find((item) => item.key === 'staff')?.done).toBe(false);
  });

  it('el siguiente paso es el pendiente de más peso', () => {
    const state = clubProfileChecklist({ ...base, description: null, logoUrl: null });
    // La descripción (12) pesa más que el escudo (10).
    expect(state.next?.key).toBe('description');
  });
});

describe('clubLocation', () => {
  it('junta ciudad y país cuando existen', () => {
    expect(clubLocation({ city: 'Valencia', country: 'Spain' })).toBe('Valencia, Spain');
  });

  it('cae al país cuando no hay ciudad', () => {
    expect(clubLocation({ city: null, country: 'Spain' })).toBe('Spain');
    expect(clubLocation({ city: '  ', country: 'Spain' })).toBe('Spain');
  });

  it('devuelve null sin datos', () => {
    expect(clubLocation({ city: null, country: '' })).toBeNull();
  });
});

describe('profileChecklistScore con una checklist propia', () => {
  it('pondera sobre el total de la checklist que se le pasa', () => {
    const state = profileChecklistScore({ activity: true }, [
      { key: 'activity', label: 'Activity', hint: 'Keep posting', weight: 30, href: '/x' },
      { key: 'other', label: 'Other', hint: 'Something else', weight: 70, href: '/y' },
    ]);
    expect(state.percent).toBe(30);
    expect(state.total).toBe(2);
    expect(state.points).toBe(30);
    expect(state.next?.key).toBe('other');
  });
});
