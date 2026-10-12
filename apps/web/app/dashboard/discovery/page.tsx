import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';
import { DraftsCard } from '@/components/discovery/drafts-card';
import { FeedList } from '@/components/discovery/feed-list';
import { FeedSearch } from '@/components/discovery/feed-search';
import { FeedSkeleton, ComposerSkeleton } from '@/components/discovery/feed-skeleton';
import { FeedTabs } from '@/components/discovery/feed-tabs';
import { PostCard } from '@/components/discovery/post-card';
import { PostComposer } from '@/components/discovery/post-composer';
import { ProfileCard } from '@/components/discovery/profile-card';
import { SuggestedProfiles } from '@/components/discovery/suggested-profiles';
import { PageHeader } from '@/components/player/page-header';
import {
  listDrafts,
  listFeed,
  listPinnedPosts,
  listProfiles,
  listSuggestedProfiles,
  parseFeedFilters,
} from '@/lib/discovery';
import { type FeedFilters } from '@/lib/discovery-content';
import { listForYouFeed } from '@/lib/discovery-recommend';

export const metadata: Metadata = { title: 'Discovery' };

/**
 * Feed compartido por todos los perfiles. El estado del filter vive en la URL
 * (`?tab=` y `?tag=`), igual que el cursor de paginación.
 *
 * La cabecera, las pestañas y el buscador se pintan de inmediato; los datos que
 * dependen de la base de datos llegan dentro de `<Suspense>`, así que la página
 * responde con esqueletos en lugar de quedarse en blanco mientras consulta.
 */
export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    tag?: string;
    q?: string;
    type?: string;
    role?: string;
    cursor?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;
  const filters = parseFeedFilters({
    tab: params.tab,
    tag: params.tag,
    q: params.q,
    type: params.type,
    role: params.role,
  });

  // El directorio de perfiles no muestra el compositor.
  const showComposer = filters.tab !== 'profiles';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Discovery"
        subtitle="Announcements, videos and milestones from every profile"
        icon="compass"
      >
        <Link
          href="/dashboard/discovery/analytics"
          className="text-sm text-muted-foreground hover:underline"
        >
          Mi rendimiento →
        </Link>
        <Link
          href="/dashboard/discovery/following"
          className="text-sm text-muted-foreground hover:underline"
        >
          Following and preferences →
        </Link>
      </PageHeader>

      {showComposer ? (
        <Suspense fallback={<ComposerSkeleton />}>
          <ComposerSection viewerId={session.user.id} />
        </Suspense>
      ) : null}

      <FeedTabs filters={filters} />
      <FeedSearch filters={filters} />

      <Suspense fallback={<FeedSkeleton posts={filters.tab === 'profiles' ? 3 : 2} />}>
        <FeedSection
          filters={filters}
          viewerId={session.user.id}
          viewerRole={session.user.role}
          cursor={params.cursor ?? null}
        />
      </Suspense>
    </div>
  );
}

/** Borradores del autor y perfiles a los que puede mencionar en el compositor. */
async function ComposerSection({ viewerId }: { viewerId: string }) {
  const [drafts, mentions] = await Promise.all([
    listDrafts(viewerId),
    listProfiles({ viewerId, limit: 6 }),
  ]);

  return (
    <>
      <DraftsCard drafts={drafts} />
      <PostComposer
        mentions={mentions.map((profile) => ({ id: profile.id, name: profile.name }))}
      />
    </>
  );
}

/** Cuerpo del feed: fijados, perfiles o posts, y sugerencias de perfiles. */
async function FeedSection({
  filters,
  viewerId,
  viewerRole,
  cursor,
}: {
  filters: FeedFilters;
  viewerId: string;
  viewerRole: string;
  cursor: string | null;
}) {
  // El directorio de perfiles no consulta posts.
  const profiles =
    filters.tab === 'profiles'
      ? await listProfiles({ q: filters.q, role: filters.role, viewerId })
      : [];

  // Las posts fijadas se muestran aparte (y se excluyen del listado).
  const pinned = filters.tab === 'recent' && !filters.q ? await listPinnedPosts(viewerId) : [];

  // "For you" se ordena con el motor de matching y no pagina (una sola página).
  const { posts, nextCursor } =
    filters.tab === 'profiles'
      ? { posts: [], nextCursor: null }
      : filters.tab === 'foryou'
        ? { posts: await listForYouFeed({ viewerId, viewerRole }), nextCursor: null }
        : await listFeed({
            viewerId,
            filters,
            cursor,
            excludeIds: pinned.map((post) => post.id),
          });

  // Sugerencias de a quién seguir en las pestañas de descubrimiento.
  const suggested =
    filters.tab === 'recent' || filters.tab === 'foryou'
      ? await listSuggestedProfiles(viewerId)
      : [];

  const emptyMessage = filters.q
    ? `No posts match “${filters.q}”.`
    : filters.tag
      ? `No posts with #${filters.tag} yet.`
      : filters.tab === 'following'
        ? 'Here you will see what the profiles you follow post. Start by following someone.'
        : 'Todavía no hay posts. Publica la primera.';

  if (filters.tab === 'profiles') {
    return profiles.length === 0 ? (
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
          <ProfileCard key={profile.id} profile={profile} viewerId={viewerId} />
        ))}
      </div>
    );
  }

  return (
    <>
      {pinned.length > 0 ? (
        <div className="mb-4 flex flex-col gap-4">
          {pinned.map((post) => (
            <PostCard key={post.id} post={post} viewerId={viewerId} viewerRole={viewerRole} />
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
        <FeedList
          key={`${filters.tab}:${filters.tag ?? ''}:${filters.q ?? ''}:${filters.type ?? ''}:${filters.role ?? ''}`}
          initialPosts={posts}
          initialCursor={nextCursor}
          filters={filters}
          viewerId={viewerId}
          viewerRole={viewerRole}
        />
      )}

      <SuggestedProfiles profiles={suggested} />
    </>
  );
}
