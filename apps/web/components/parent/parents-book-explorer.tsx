'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Flag, HeartPulse, Lightbulb, Route, Search, Users } from 'lucide-react';
import type { ParentsBookDoc } from '@/lib/parents-book';

const CATEGORY_STYLE: Record<string, { tag: string; dot: string }> = {
  Mindset: { tag: 'fb-tag-violet', dot: '#a78bfa' },
  Wellbeing: { tag: 'fb-tag-lime', dot: '#84cc16' },
  Matchday: { tag: 'fb-tag-amber', dot: '#f59e0b' },
  Pathway: { tag: 'fb-tag-blue', dot: '#38bdf8' },
  Support: { tag: 'fb-tag-gray', dot: '#9aa0a6' },
};

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Mindset: Lightbulb,
  Wellbeing: HeartPulse,
  Matchday: Flag,
  Pathway: Route,
  Support: Users,
};

function styleOf(category: string) {
  return CATEGORY_STYLE[category] ?? { tag: 'fb-tag-gray', dot: '#9aa0a6' };
}

function iconOf(category: string): LucideIcon {
  return CATEGORY_ICON[category] ?? BookOpen;
}

/** Lista interactiva del Parents Book: buscador, filtros por categoria y tarjetas animadas. */
export function ParentsBookExplorer({ docs }: { docs: ParentsBookDoc[] }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(docs.map((doc) => doc.category)))],
    [docs]
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const doc of docs) map.set(doc.category, (map.get(doc.category) ?? 0) + 1);
    return map;
  }, [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((doc) => {
      if (active !== 'All' && doc.category !== active) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) || (doc.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [docs, query, active]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search the Parents Book…"
            aria-label="Search documents"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = category === active;
            const count = category === 'All' ? docs.length : counts.get(category) ?? 0;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white transition-colors'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                }
              >
                {category}
                <span className={isActive ? 'text-white/60' : 'text-muted-foreground/60'}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {filtered.length} document{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No documents match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc, index) => {
            const style = styleOf(doc.category);
            const Icon = iconOf(doc.category);
            return (
              <Link
                key={doc.slug}
                href={`/dashboard/parent/parents-book/${doc.slug}`}
                className="group animate-fade-up block"
                style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              >
                <div className="glass-card card-hover relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl p-5 hover:ring-2 hover:ring-brand/30">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: style.dot }}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`fb-tag ${style.tag}`}>{doc.category}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {doc.ext}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-[#4f6b0a] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-base font-bold leading-snug">{doc.title}</h2>
                      {doc.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors group-hover:text-[#4f6b0a]">
                    Open
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
