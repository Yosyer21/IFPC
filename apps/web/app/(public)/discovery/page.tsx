import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { FeedSearch } from '@/components/discovery/feed-search';
import { FeedTabs } from '@/components/discovery/feed-tabs';
import { PostCard } from '@/components/discovery/post-card';
import { ProfileCard } from '@/components/discovery/profile-card';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { PageHeader } from '@/components/player/page-header';
import {
  PUBLIC_DISCOVERY_TABS,
  listFeed,
  listPinnedPosts,
  listProfiles,
  parseFeedFilters,
  publicFeedFilters,
} from '@/lib/discovery';

export const metadata: Metadata = {
  title: 'Discovery — Future Baller',
  description:
    'Announcements, videos and milestones from clubs, players, schools and universities on Future Baller.',
  alternates: { canonical: '/discovery' },
  openGraph: {
    title: 'Discovery — Future Baller',
    description: 'The public feed of the Future Baller community.',
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
  searchParams: Promise<{ tab?: string; tag?: string; q?: string; type?: string; role?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const filters = publicFeedFilters(
    parseFeedFilters({
      tab: params.tab,
      tag: params.tag,
      q: params.q,
      type: params.type,
      role: params.role,
    })
  );

  // El directorio de perfiles no consulta posts ni fijadas.
  const profiles =
    filters.tab === 'profiles'
      ? await listProfiles({ q: filters.q, role: filters.role })
      : [];

  const pinned =
    filters.tab === 'recent' && !filters.q ? await listPinnedPosts(null) : [];
  const { posts, nextCursor } =
    filters.tab === 'profiles'
      ? { posts: [], nextCursor: null }
      : await listFeed({
          filters,
          cursor: params.cursor ?? null,
          excludeIds: pinned.map((post) => post.id),
        });

  const moreQuery = new URLSearchParams();
  if (filters.tab !== 'recent') moreQuery.set('tab', filters.tab);
  if (filters.tag) moreQuery.set('tag', filters.tag);
  if (filters.q) moreQuery.set('q', filters.q);
  if (filters.type) moreQuery.set('type', filters.type);
  if (filters.role) moreQuery.set('role', filters.role);
  if (nextCursor) moreQuery.set('cursor', nextCursor);

  const emptyMessage = filters.q
    ? `No posts match “${filters.q}”.`
    : filters.tag
      ? `No posts with #${filters.tag} yet.`
      : 'There are no posts yet. Sign in and publish the first one.';

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-24">
        <PageHeader
          title="Discovery"
          subtitle="Announcements, videos and milestones from every profile"
          icon="compass"
        />

        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              You are viewing Discovery in read-only mode. Sign in to post, comment and follow
              profiles.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                Sign in
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

        {filters.tab === 'profiles' ? (
          profiles.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No profiles match the filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} base={BASE} readOnly />
              ))}
            </div>
          )
        ) : posts.length === 0 ? (
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
              Show more
            </Link>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
