import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { FeedSearch } from '@/components/discovery/feed-search';
import { FeedTabs } from '@/components/discovery/feed-tabs';
import { PostCard } from '@/components/discovery/post-card';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { PageHeader } from '@/components/player/page-header';
import {
  PUBLIC_DISCOVERY_TABS,
  listFeed,
  listPinnedPosts,
  parseFeedFilters,
  publicFeedFilters,
} from '@/lib/discovery';

export const metadata: Metadata = {
  title: 'Discovery — Future Baller',
  description:
    'Anuncios, vídeos y logros de clubes, jugadores, escuelas y universidades en Future Baller.',
  alternates: { canonical: '/discovery' },
  openGraph: {
    title: 'Discovery — Future Baller',
    description: 'El feed público de la comunidad Future Baller.',
    type: 'website',
  },
};

const BASE = '/discovery';

/**
 * Espejo público del feed: solo lectura y sin sesión. Reutiliza los mismos
 * componentes y consultas que el área privada (`readOnly`).
 */
export default async function PublicDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; tag?: string; q?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const filters = publicFeedFilters(
    parseFeedFilters({ tab: params.tab, tag: params.tag, q: params.q })
  );

  const pinned = filters.tab === 'recent' && !filters.q ? await listPinnedPosts(null) : [];
  const { posts, nextCursor } = await listFeed({
    filters,
    cursor: params.cursor ?? null,
    excludeIds: pinned.map((post) => post.id),
  });

  const moreQuery = new URLSearchParams();
  if (filters.tab !== 'recent') moreQuery.set('tab', filters.tab);
  if (filters.tag) moreQuery.set('tag', filters.tag);
  if (filters.q) moreQuery.set('q', filters.q);
  if (nextCursor) moreQuery.set('cursor', nextCursor);

  const emptyMessage = filters.q
    ? `No hay publicaciones que coincidan con “${filters.q}”.`
    : filters.tag
      ? `Todavía no hay publicaciones con #${filters.tag}.`
      : 'Todavía no hay publicaciones. Entra y publica la primera.';

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-24">
        <PageHeader
          title="Discovery"
          subtitle="Anuncios, vídeos y logros de todos los perfiles"
          icon="compass"
        />

        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Estás viendo Discovery en modo lectura. Entra para publicar, comentar y seguir
              perfiles.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>

        <FeedTabs filters={filters} tabs={PUBLIC_DISCOVERY_TABS} base={BASE} />
        <FeedSearch filters={filters} base={BASE} />

        {pinned.length > 0 ? (
          <div className="mb-4 flex flex-col gap-4">
            {pinned.map((post) => (
              <PostCard key={post.id} post={post} viewerId="" viewerRole="" readOnly />
            ))}
          </div>
        ) : null}

        {posts.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} viewerId="" viewerRole="" readOnly />
            ))}
          </div>
        )}

        {nextCursor ? (
          <div className="mt-6 flex justify-center">
            <Link
              href={`${BASE}?${moreQuery.toString()}`}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              Ver más
            </Link>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
