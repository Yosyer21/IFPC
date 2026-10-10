import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  postFindMany: vi.fn(),
  playerFindUnique: vi.fn(),
  playerFindMany: vi.fn(),
  clubFindUnique: vi.fn(),
  universityFindUnique: vi.fn(),
  opportunityFindMany: vi.fn(),
  privacyFindMany: vi.fn(),
  notInterestedFindMany: vi.fn(),
  authorPreferenceFindMany: vi.fn(),
  followFindMany: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    post: { findMany: mocks.postFindMany },
    player: { findUnique: mocks.playerFindUnique, findMany: mocks.playerFindMany },
    club: { findUnique: mocks.clubFindUnique },
    university: { findUnique: mocks.universityFindUnique },
    opportunity: { findMany: mocks.opportunityFindMany },
    privacyRule: { findMany: mocks.privacyFindMany },
    postNotInterested: { findMany: mocks.notInterestedFindMany },
    authorPreference: { findMany: mocks.authorPreferenceFindMany },
    follow: { findMany: mocks.followFindMany },
  },
}));

import {
  listForYouFeed,
  rankForYou,
  relevanceForOpportunities,
  relevanceForPlayer,
  type ScorablePlayer,
} from '@/lib/discovery-recommend';

/** Fecha de nacimiento con 18 años cumplidos en el año en curso (estable). */
function age18(): Date {
  return new Date(new Date().getFullYear() - 18, 0, 1);
}

const player: ScorablePlayer = {
  position: 'DEL',
  dateOfBirth: age18(),
  nationality: 'Argentina',
  competitionLevel: 'nacional',
  status: 'AVAILABLE',
};

const opportunity = (
  position: string | null,
  ageMin: number | null = null,
  ageMax: number | null = null
) => ({
  position,
  ageMin,
  ageMax,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.postFindMany.mockResolvedValue([]);
  mocks.playerFindUnique.mockResolvedValue(null);
  mocks.playerFindMany.mockResolvedValue([]);
  mocks.clubFindUnique.mockResolvedValue(null);
  mocks.universityFindUnique.mockResolvedValue(null);
  mocks.opportunityFindMany.mockResolvedValue([]);
  mocks.privacyFindMany.mockResolvedValue([]);
  mocks.notInterestedFindMany.mockResolvedValue([]);
  mocks.authorPreferenceFindMany.mockResolvedValue([]);
  mocks.followFindMany.mockResolvedValue([]);
});

describe('relevanceForPlayer', () => {
  it('sin oportunidad compartida no hay relevancia', () => {
    expect(relevanceForPlayer(null, player)).toBeNull();
  });

  it('la oportunidad que encaja puntúa por encima de la que no', () => {
    // Posición coincidente y resto neutro → 100; posición distinta → 75.
    expect(relevanceForPlayer(opportunity('DEL'), player)).toBe(100);
    expect(relevanceForPlayer(opportunity('POR'), player)).toBe(75);
  });

  it('penaliza una edad fuera del rango', () => {
    const aligned = relevanceForPlayer(opportunity('DEL', 17, 19), player) ?? 0;
    const offRange = relevanceForPlayer(opportunity('DEL', 30, 35), player) ?? 0;
    expect(aligned).toBeGreaterThan(offRange);
    expect(offRange).toBe(75);
  });
});

describe('relevanceForOpportunities', () => {
  it('sin autor jugador o sin oportunidades no hay relevancia', () => {
    expect(relevanceForOpportunities(null, [opportunity('DEL')])).toBeNull();
    expect(relevanceForOpportunities(player, [])).toBeNull();
  });

  it('se queda con el mejor encaje de todas las oportunidades', () => {
    expect(relevanceForOpportunities(player, [opportunity('POR'), opportunity('DEL')])).toBe(100);
    expect(relevanceForOpportunities(player, [opportunity('POR')])).toBe(75);
  });
});

describe('rankForYou', () => {
  const posts = [
    { id: 'a', score: 80 },
    { id: 'b', score: 30 },
    { id: 'c', score: null },
    { id: 'd', score: 90 },
  ];

  it('coloca primero los que superan el umbral, de mayor a menor', () => {
    expect(rankForYou(posts, (post) => post.score).map((post) => post.id)).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
  });

  it('mantiene el orden de entrada en los que no encajan', () => {
    const rest = rankForYou(posts, (post) => post.score).slice(2);
    expect(rest.map((post) => post.id)).toEqual(['b', 'c']);
  });

  it('respeta un umbral distinto', () => {
    expect(rankForYou(posts, (post) => post.score, 85).map((post) => post.id)).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
    expect(rankForYou(posts, (post) => post.score, 95).map((post) => post.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('no muta el array original', () => {
    const original = posts.map((post) => post.id);
    rankForYou(posts, (post) => post.score);
    expect(posts.map((post) => post.id)).toEqual(original);
  });
});

describe('listForYouFeed', () => {
  function row(id: string, overrides: Record<string, unknown> = {}) {
    return {
      id,
      type: 'ANNOUNCEMENT',
      status: 'PUBLISHED',
      title: null,
      body: 'texto',
      mediaUrl: null,
      mediaKind: null,
      linkUrl: null,
      tags: [],
      pinnedAt: null,
      createdAt: new Date('2026-01-01'),
      author: { id: 'author-1', name: 'Ana Ruíz', role: 'CLUB', image: null },
      opportunity: null,
      _count: { likes: 0, comments: 0, views: 0 },
      likes: [],
      ...overrides,
    };
  }

  const matchedOpportunity = {
    id: 'opp-1',
    title: 'Buscamos delantero',
    position: 'DEL',
    ageMin: null,
    ageMax: null,
  };

  it('para un jugador sube las publicaciones cuya oportunidad encaja', async () => {
    mocks.playerFindUnique.mockResolvedValue(player);
    mocks.postFindMany.mockResolvedValue([
      row('sin-oportunidad'),
      row('con-oportunidad', { opportunity: matchedOpportunity }),
    ]);

    const posts = await listForYouFeed({ viewerId: 'viewer-1', viewerRole: 'PLAYER' });

    expect(posts.map((post) => post.id)).toEqual(['con-oportunidad', 'sin-oportunidad']);
    expect(posts[0]?.relevance).toBe(100);
    expect(posts[1]?.relevance).toBeNull();
  });

  it('para un club sube las publicaciones de jugadores que encajan con sus oportunidades', async () => {
    mocks.clubFindUnique.mockResolvedValue({ id: 'club-1' });
    mocks.opportunityFindMany.mockResolvedValue([opportunity('DEL')]);
    mocks.playerFindMany.mockResolvedValue([{ userId: 'author-1', ...player }]);
    mocks.postFindMany.mockResolvedValue([
      row('de-club', { author: { id: 'author-2', name: 'Otro club', role: 'CLUB', image: null } }),
      row('de-jugador', {
        author: { id: 'author-1', name: 'Jugador Demo', role: 'PLAYER', image: null },
      }),
    ]);

    const posts = await listForYouFeed({ viewerId: 'viewer-club', viewerRole: 'CLUB' });

    expect(posts.map((post) => post.id)).toEqual(['de-jugador', 'de-club']);
    expect(posts[0]?.relevance).toBe(100);
    expect(posts[1]?.relevance).toBeNull();
  });

  it('sin contexto puntuable mantiene el orden reciente y no añade relevancia', async () => {
    mocks.postFindMany.mockResolvedValue([row('p1'), row('p2')]);

    const posts = await listForYouFeed({ viewerId: 'viewer-1', viewerRole: 'PARENT' });

    expect(posts.map((post) => post.id)).toEqual(['p1', 'p2']);
    // `null` = no hay encaje calculable (no se inventa relevancia).
    expect(posts[0]?.relevance).toBeNull();
    expect(mocks.playerFindUnique).not.toHaveBeenCalled();
    expect(mocks.opportunityFindMany).not.toHaveBeenCalled();
  });

  it('sube a quien sigues aunque no haya contexto puntuable', async () => {
    // El del autor seguido es más antiguo: sin preferencias iría después.
    mocks.postFindMany.mockResolvedValue([
      row('p1'),
      row('p2', {
        author: { id: 'autor-seguido', name: 'Club Seguido', role: 'CLUB', image: null },
      }),
    ]);
    mocks.followFindMany.mockResolvedValue([{ followingId: 'autor-seguido' }]);

    const posts = await listForYouFeed({ viewerId: 'viewer-1', viewerRole: 'PARENT' });

    expect(posts.map((post) => post.id)).toEqual(['p2', 'p1']);
  });

  it('«ver más» también sube, y sin preferencias se respeta la fecha', async () => {
    mocks.postFindMany.mockResolvedValue([
      row('p1'),
      row('p2', { author: { id: 'autor-mas', name: 'Club X', role: 'CLUB', image: null } }),
    ]);
    mocks.authorPreferenceFindMany.mockResolvedValue([{ authorId: 'autor-mas', kind: 'MORE' }]);

    const posts = await listForYouFeed({ viewerId: 'viewer-1', viewerRole: 'PARENT' });

    expect(posts.map((post) => post.id)).toEqual(['p2', 'p1']);
  });

  it('quien tiene «ver menos» queda fuera de Para ti', async () => {
    mocks.authorPreferenceFindMany.mockResolvedValue([{ authorId: 'autor-menos', kind: 'LESS' }]);

    await listForYouFeed({ viewerId: 'viewer-1', viewerRole: 'PARENT' });

    expect(mocks.postFindMany.mock.calls[0][0].where.authorId).toEqual({ notIn: ['autor-menos'] });
  });

  it('un club sin oportunidades abiertas no puntúa nada', async () => {
    mocks.clubFindUnique.mockResolvedValue({ id: 'club-1' });
    mocks.opportunityFindMany.mockResolvedValue([]);
    mocks.postFindMany.mockResolvedValue([row('p1')]);

    const posts = await listForYouFeed({ viewerId: 'viewer-club', viewerRole: 'CLUB' });

    expect(posts[0]?.relevance).toBeNull();
  });
});
