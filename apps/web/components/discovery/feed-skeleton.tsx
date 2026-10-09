/**
 * Esqueletos del feed: se ven mientras el servidor prepara los datos (Suspense y
 * `loading.tsx`) y evitan que la página salte. Son decorativos, así que se
 * anuncian como "cargando" sin que el lector de pantalla lea formas vacías.
 */
import { Card, CardContent } from '@ifpc/ui';

const bar = 'animate-pulse rounded bg-white/10';

/** Esqueleto de una publicación. */
export function PostSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className={`h-9 w-9 shrink-0 rounded-full ${bar}`} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className={`h-3.5 w-40 ${bar}`} />
            <div className={`h-3 w-full ${bar}`} />
            <div className={`h-3 w-3/4 ${bar}`} />
          </div>
        </div>
        <div className="mt-3 flex gap-4 border-t border-white/10 pt-3">
          <div className={`h-3 w-16 ${bar}`} />
          <div className={`h-3 w-20 ${bar}`} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Esqueleto de la lista de publicaciones. */
export function FeedSkeleton({ posts = 3 }: { posts?: number }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Cargando publicaciones…</span>
      {Array.from({ length: posts }, (_value, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  );
}

/** Esqueleto del compositor (mientras se cargan borradores y menciones). */
export function ComposerSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="glass-card mb-6 flex h-44 animate-pulse flex-col gap-3 rounded-2xl p-4"
    >
      <span className="sr-only">Cargando el compositor…</span>
      <div className={`h-4 w-24 ${bar}`} />
      <div className={`h-16 w-full ${bar}`} />
      <div className={`h-8 w-32 self-end ${bar}`} />
    </div>
  );
}
