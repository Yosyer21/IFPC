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

/** URL del feed conservando pestaña, etiqueta y filtros (sin búsqueda). */
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
 * Filtros del feed: búsqueda + tipo de publicación + rol del autor. Es un
 * formulario GET, así que funciona sin JavaScript y queda todo en la URL.
 */
export function FeedSearch({
  filters,
  base = '/dashboard/discovery',
  tab,
}: {
  filters: FeedFilters;
  base?: string;
  /** Pestaña que se conserva al filtrar (el público no tiene "Siguiendo"). */
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
        className={`${fieldClass} min-w-0 flex-1`}
      />
      <select name="type" defaultValue={filters.type ?? ''} aria-label="Tipo de publicación" className={fieldClass}>
        <option value="">Todo tipo</option>
        {FEED_TYPE_FILTERS.map((value) => (
          <option key={value} value={value}>
            {POST_TYPE_LABELS[value] ?? value}
          </option>
        ))}
      </select>
      <select name="role" defaultValue={filters.role ?? ''} aria-label="Rol del autor" className={fieldClass}>
        <option value="">Todos los perfiles</option>
        {FEED_ROLE_FILTERS.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value] ?? value}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline">
        Filtrar
      </Button>
      {filters.q ? (
        <Link href={clearHref(filters, base)} className="text-xs text-muted-foreground hover:text-foreground">
          Quitar búsqueda
        </Link>
      ) : null}
    </form>
  );
}
