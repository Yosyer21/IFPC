import Link from 'next/link';
import { Button } from '@ifpc/ui';
import { FEED_QUERY_MAX, type FeedFilters } from '@/lib/discovery-content';

/** URL del feed conservando pestaña y etiqueta (sin búsqueda). */
function clearHref(filters: FeedFilters, base: string): string {
  const query = new URLSearchParams();
  if (filters.tab !== 'recent') query.set('tab', filters.tab);
  if (filters.tag) query.set('tag', filters.tag);
  const search = query.toString();
  return `${base}${search ? `?${search}` : ''}`;
}

/**
 * Buscador del feed. Es un formulario GET, así que funciona sin JavaScript y la
 * búsqueda queda en la URL (compartible). Sirve igual dentro y fuera de la sesión.
 */
export function FeedSearch({
  filters,
  base = '/dashboard/discovery',
  tab,
}: {
  filters: FeedFilters;
  base?: string;
  /** Pestaña que se conserva al buscar (el público no tiene "Siguiendo"). */
  tab?: string;
}) {
  const keepTab = tab ?? filters.tab;

  return (
    <form action={base} method="get" className="mb-4 flex flex-wrap items-center gap-2">
      {keepTab !== 'recent' ? <input type="hidden" name="tab" value={keepTab} /> : null}
      {filters.tag ? <input type="hidden" name="tag" value={filters.tag} /> : null}
      <input
        type="search"
        name="q"
        defaultValue={filters.q ?? ''}
        maxLength={FEED_QUERY_MAX}
        placeholder="Buscar publicaciones o perfiles…"
        aria-label="Buscar en Discovery"
        className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-white/5 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40"
      />
      <Button type="submit" variant="outline">
        Buscar
      </Button>
      {filters.q ? (
        <Link
          href={clearHref(filters, base)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Quitar búsqueda
        </Link>
      ) : null}
    </form>
  );
}
