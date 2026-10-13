'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NavSection } from './nav';
import { ICONS, IconSearch } from './icons';

interface PaletteItem {
  href: string;
  label: string;
  icon?: string;
  section: string;
}

/**
 * Búsqueda global de páginas (⌘K / Ctrl+K). Filtra los items del nav del rol y
 * navega con teclado (↑ ↓ Enter) o clic. Se monta una sola vez en el shell.
 */
export function CommandPalette({
  open,
  onClose,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  sections: NavSection[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const flat: PaletteItem[] = sections.flatMap((section) =>
      section.items.map((item) => ({ ...item, section: section.label }))
    );
    const q = query.trim().toLowerCase();
    if (!q) return flat;
    return flat.filter(
      (item) => item.label.toLowerCase().includes(q) || item.section.toLowerCase().includes(q)
    );
  }, [sections, query]);

  // Reset + foco al abrir.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    // Espera al render del input antes de enfocar.
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((value) => Math.min(value + 1, Math.max(items.length - 1, 0)));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((value) => Math.max(value - 1, 0));
      } else if (event.key === 'Enter') {
        const item = items[active];
        if (item) {
          event.preventDefault();
          onClose();
          router.push(item.href);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, active, onClose, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        className="surface animate-scale-in w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
          <IconSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages…"
            aria-label="Search pages"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-1">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No pages match “{query}”.
            </li>
          ) : (
            items.map((item, index) => {
              const Icon = item.icon ? ICONS[item.icon] : undefined;
              const isActive = index === active;
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      onClose();
                      router.push(item.href);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'chip-gradient font-medium'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    {Icon ? (
                      <Icon className="h-4 w-4 shrink-0" />
                    ) : (
                      <span className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wide opacity-60">
                      {item.section}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
