import type { MetadataRoute } from 'next';
import { prisma } from '@ifpc/database';

// Consulta la DB en cada petición (PGlite/WASM no es compatible con el prerender estático).
export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [players, clubs, opportunities, content] = await Promise.all([
    prisma.player.findMany({
      where: { status: { in: ['AVAILABLE', 'ACTIVE'] } },
      select: { id: true, updatedAt: true },
      take: 500,
    }),
    prisma.club.findMany({
      where: { verified: true },
      select: { id: true, updatedAt: true },
      take: 200,
    }),
    prisma.opportunity.findMany({
      where: { status: 'OPEN' },
      select: { id: true, updatedAt: true },
      take: 200,
    }),
    prisma.trainingContent.findMany({
      where: { category: { not: 'parent-education' } },
      select: { id: true, updatedAt: true },
      take: 200,
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/contact',
    '/clubs',
    '/camps',
    '/opportunities',
    '/players',
    '/training',
    '/parent-hub',
    '/pathways',
    '/register',
    '/login',
  ].map((route) => ({ url: `${BASE}${route}`, changeFrequency: 'weekly' }));

  return [
    ...staticRoutes,
    ...players.map((player) => ({
      url: `${BASE}/players/${player.id}`,
      lastModified: player.updatedAt,
    })),
    ...clubs.map((club) => ({
      url: `${BASE}/clubs/${club.id}`,
      lastModified: club.updatedAt,
    })),
    ...opportunities.map((opportunity) => ({
      url: `${BASE}/opportunities/${opportunity.id}`,
      lastModified: opportunity.updatedAt,
    })),
    ...content.map((item) => ({
      url: `${BASE}/training/${item.id}`,
      lastModified: item.updatedAt,
    })),
  ];
}
