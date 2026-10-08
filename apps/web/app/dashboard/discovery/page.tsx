import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';
import { FeedTabs } from '@/components/discovery/feed-tabs';
import { PostCard } from '@/components/discovery/post-card';
import { PostComposer } from '@/components/discovery/post-composer';
import { PageHeader } from '@/components/player/page-header';
import { listFeed, parseFeedFilters } from '@/lib/discovery';

export const metadata: Metadata = { title: 'Discovery' };

/**
 * Feed compartido por todos los perfiles. El estado del filtro vive en la URL
 * (`?tab=` y `?tag=`), igual que el cursor de paginación.
 */
export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; tag?: string; cursor?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;
  const filters = parseFeedFilters({ tab: params.tab, tag: params.tag });
  const { posts, nextCursor } = await listFeed({
    viewerId: session.user.id,
    filters,
    cursor: params.cursor ?? null,
  });

  const moreQuery = new URLSearchParams();
  if (filters.tab !== 'recent') moreQuery.set('tab', filters.tab);
  if (filters.tag) moreQuery.set('tag', filters.tag);
  if (nextCursor) moreQuery.set('cursor', nextCursor);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Discovery"
        subtitle="Anuncios, vídeos y logros de todos los perfiles"
        icon="compass"
      />

      <PostComposer />
      <FeedTabs filters={filters} />

      {posts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {filters.tag
                ? `Todavía no hay publicaciones con #${filters.tag}.`
                : 'Todavía no hay publicaciones. Publica la primera.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={session.user.id}
              viewerRole={session.user.role}
            />
          ))}
        </div>
      )}

      {nextCursor ? (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/dashboard/discovery?${moreQuery.toString()}`}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            Ver más
          </Link>
        </div>
      ) : null}
    </div>
  );
}
