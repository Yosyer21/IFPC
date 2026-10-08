import Link from 'next/link';
import { DISCOVERY_TAB_LABELS, DISCOVERY_TABS } from '@ifpc/config';
import type { FeedFilters } from '@/lib/discovery';

function hrefFor(tab: string, tag: string | null): string {
  const query = new URLSearchParams();
  if (tab !== 'recent') query.set('tab', tab);
  if (tag) query.set('tag', tag);
  const search = query.toString();
  return `/dashboard/discovery${search ? `?${search}` : ''}`;
}

/** Pestañas del feed. Son enlaces (no JS): el estado vive en la URL. */
export function FeedTabs({ filters }: { filters: FeedFilters }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2">
      {DISCOVERY_TABS.map((tab) => {
        const active = tab === filters.tab;
        return (
          <Link
            key={tab}
            href={hrefFor(tab, filters.tag)}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            {DISCOVERY_TAB_LABELS[tab]}
          </Link>
        );
      })}

      {filters.tag ? (
        <Link
          href={hrefFor(filters.tab, null)}
          className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          Quitar #{filters.tag}
        </Link>
      ) : null}
    </nav>
  );
}
