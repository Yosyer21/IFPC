'use client';

import { useState, useTransition } from 'react';
import { loadMoreFeedAction } from '@/app/actions/discovery';
import type { FeedFilters, FeedPost } from '@/lib/discovery-content';
import { PostCard } from './post-card';

/**
 * Lista del feed con carga incremental: las publicaciones del servidor son la
 * fuente de verdad y aquí solo se acumulan las páginas siguientes, así que un
 * refresco de la ruta (tras un me gusta, por ejemplo) no pierde lo cargado.
 */
export function FeedList({
  initialPosts,
  initialCursor,
  filters,
  viewerId,
  viewerRole,
}: {
  initialPosts: FeedPost[];
  initialCursor: string | null;
  filters: FeedFilters;
  viewerId: string;
  viewerRole: string;
}) {
  const [extra, setExtra] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, startTransition] = useTransition();

  const posts = [...initialPosts, ...extra];

  const loadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const page = await loadMoreFeedAction({
        tab: filters.tab,
        tag: filters.tag,
        q: filters.q,
        cursor,
      });
      setExtra((current) => [...current, ...page.posts]);
      setCursor(page.nextCursor);
    });
  };

  if (posts.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            viewerId={viewerId}
            viewerRole={viewerRole}
          />
        ))}
      </div>

      {cursor ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
          >
            {pending ? 'Cargando…' : 'Ver más'}
          </button>
        </div>
      ) : null}
    </>
  );
}
