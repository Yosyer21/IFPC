import Link from 'next/link';
import { DISCOVERY_TAB_LABELS, DISCOVERY_TABS } from '@ifpc/config';
import type { FeedFilters } from '@/lib/discovery';

/** URL de una pestaña conservando etiqueta y búsqueda. */
function hrefFor(base: string, tab: string, filters: FeedFilters): string {
  const query = new URLSearchParams();
  if (tab !== 'recent') query.set('tab', tab);
  if (filters.tag) query.set('tag', filters.tag);
  if (filters.q) query.set('q', filters.q);
  const search = query.toString();
  return `${base}${search ? `?${search}` : ''}`;
}

/**
 * Pestañas del feed. Son enlaces (no JS): el estado vive en la URL, así que
 * funcionan igual en el área privada y en el espejo público.
 */
export function FeedTabs({
  filters,
  tabs = DISCOVERY_TABS,
  base = '/dashboard/discovery',
}: {
  filters: FeedFilters;
  /** Pestañas a mostrar (el espejo público oculta "Para ti" y "Siguiendo"). */
  tabs?: readonly string[];
  base?: string;
}) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const active = tab === filters.tab;
        return (
          <Link
            key={tab}
            href={hrefFor(base, tab, filters)}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            {DISCOVERY_TAB_LABELS[tab] ?? tab}
          </Link>
        );
      })}

      {filters.tag ? (
        <Link
          href={hrefFor(base, filters.tab, { ...filters, tag: null })}
          className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          Quitar #{filters.tag}
        </Link>
      ) : null}
    </nav>
  );
}
