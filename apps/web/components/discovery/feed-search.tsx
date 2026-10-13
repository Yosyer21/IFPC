import Link from 'next/link';
import { POST_TYPE_LABELS, ROLE_LABELS } from '@ifpc/config';
import { Button } from '@ifpc/ui';
import {
  FEED_QUERY_MAX,
  FEED_ROLE_FILTERS,
  FEED_TYPE_FILTERS,
  type FeedFilters,
} from '@/lib/discovery-content';

const fieldClass =
  'h-10 rounded-xl border border-border bg-white/5 px-3 text-sm outline-none transition-colors focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40';

/** URL del feed conservando pestaña, tag y filters (sin búsqueda). */
function clearHref(filters: FeedFilters, base: string): string {
  const query = new URLSearchParams();
  if (filters.tab !== 'recent') query.set('tab', filters.tab);
  if (filters.tag) query.set('tag', filters.tag);
  if (filters.type) query.set('type', filters.type);
  if (filters.role) query.set('role', filters.role);
  const search = query.toString();
  return `${base}${search ? `?${search}` : ''}`;
}

/**
 * Filtros del feed: búsqueda + tipo de post + rol del autor. Es un
 * formulario GET, así que funciona sin JavaScript y queda todo en la URL.
 */
export function FeedSearch({
  filters,
  base = '/dashboard/discovery',
  tab,
}: {
  filters: FeedFilters;
  base?: string;
  /** Pestaña que se conserva al filtrar (el público no tiene "Following"). */
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
        placeholder="Search posts or profiles…"
        aria-label="Search Discovery"
        className={`${fieldClass} min-w-0 flex-1`}
      />
      <select name="type" defaultValue={filters.type ?? ''} aria-label="Post type" className={fieldClass}>
        <option value="">All types</option>
        {FEED_TYPE_FILTERS.map((value) => (
          <option key={value} value={value}>
            {POST_TYPE_LABELS[value] ?? value}
          </option>
        ))}
      </select>
      <select name="role" defaultValue={filters.role ?? ''} aria-label="Author role" className={fieldClass}>
        <option value="">All profiles</option>
        {FEED_ROLE_FILTERS.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value] ?? value}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline">
        Filter
      </Button>
      {filters.q ? (
        <Link href={clearHref(filters, base)} className="text-xs text-muted-foreground hover:text-foreground">
          Clear search
        </Link>
      ) : null}
    </form>
  );
}
