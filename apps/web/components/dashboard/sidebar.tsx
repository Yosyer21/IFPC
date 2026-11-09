'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip } from '@ifpc/ui';
import { ICONS, IconPanelLeft, IconSearch, IconX } from './icons';
import type { NavItem, NavSection } from './nav';

/** Areas de rol: la portada `/dashboard/<rol>` es prefijo de todas sus subpaginas. */
const ROLE_AREAS = new Set([
  'player',
  'parent',
  'coach',
  'scout',
  'agent',
  'club',
  'university',
  'school',
  'admin',
]);

function isActiveHref(pathname: string, href: string) {
  const areaRoot = /^\/dashboard\/([^/]+)$/.exec(href)?.[1];
  if (areaRoot && ROLE_AREAS.has(areaRoot)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Activo si coincide la ruta propia o alguna de sus rutas heredadas (`match`). */
function isActiveItem(pathname: string, item: NavItem) {
  if (isActiveHref(pathname, item.href)) return true;
  return item.match?.some((href) => isActiveHref(pathname, href)) ?? false;
}

/** Wordmark FUTURE BALLER: FUTURE en blanco, BALLER en verde lima. */
function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display uppercase leading-none tracking-tight ${className}`}>
      <span className="text-white">FUTURE </span>
      <span className="text-brand">BALLER</span>
    </span>
  );
}

/**
 * Lista de navegacion: grupos con etiqueta en mayusculas e items compactos. El
 * item activo va con fondo lima y texto oscuro (estilo de referencia). En modo
 * `collapsed` se pinta como rail de iconos con tooltip; `flat` es el drawer movil.
 */
function NavItems({
  sections,
  collapsed,
  flat = false,
  unreadCount,
}: {
  sections: NavSection[];
  collapsed: boolean;
  flat?: boolean;
  unreadCount?: number;
}) {
  const pathname = usePathname();

  if (collapsed) {
    return (
      <nav className="flex flex-col items-center gap-1" aria-label="Main navigation">
        {sections.map((section, index) => (
          <div
            key={section.label}
            className={`flex w-full flex-col items-center gap-1 ${
              index > 0 ? 'mt-2 border-t border-white/10 pt-2' : ''
            }`}
          >
            {section.items.map((item) => {
              const Icon = item.icon ? ICONS[item.icon] : undefined;
              const active = isActiveItem(pathname, item);
              return (
                <Tooltip key={item.href} content={item.label}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-brand text-ink'
                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {Icon ? <Icon className="h-5 w-5" /> : <span className="h-5 w-5" />}
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-5" aria-label="Main navigation">
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
            {section.label}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon ? ICONS[item.icon] : undefined;
            const active = isActiveItem(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center rounded-lg transition-colors ${
                  flat ? 'gap-3 px-3 py-2.5 text-sm' : 'gap-2.5 px-3 py-2 text-[13px]'
                } ${
                  active
                    ? 'bg-brand font-semibold text-ink'
                    : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`}
              >
                {Icon ? (
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-ink' : 'text-white/70 group-hover:text-white'
                    }`}
                  />
                ) : (
                  <span className="h-4 w-4 shrink-0" />
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.href.includes('/notifications') && unreadCount ? (
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-bold ${
                      active ? 'bg-ink text-brand' : 'bg-brand text-ink'
                    }`}
                  >
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function DashboardSidebar({
  sections,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onOpenSearch,
  unreadCount,
}: {
  sections: NavSection[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSearch: () => void;
  unreadCount?: number;
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!mobileOpen) setQuery('');
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMobile();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  const trimmed = query.trim().toLowerCase();
  const visibleSections = trimmed
    ? sections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.label.toLowerCase().includes(trimmed) ||
              section.label.toLowerCase().includes(trimmed)
          ),
        }))
        .filter((section) => section.items.length > 0)
    : sections;

  return (
    <>
      <div
        className="nav-layer fixed inset-0 z-50 md:hidden"
        data-open={mobileOpen ? 'true' : undefined}
      >
        <div
          className="nav-scrim absolute inset-0 bg-black/60"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="nav-drawer pt-safe pb-safe absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto border-r border-white/10 bg-ink p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <Link href="/" aria-label="Future Baller home">
              <Wordmark className="text-xl" />
            </Link>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search in the menu…"
            aria-label="Filter navigation"
            className="mb-4 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-brand/60"
          />

          {visibleSections.length > 0 ? (
            <NavItems sections={visibleSections} collapsed={false} flat unreadCount={unreadCount} />
          ) : (
            <p className="px-3 py-6 text-center text-sm text-white/50">
              Nothing matches “{query.trim()}”.
            </p>
          )}
        </aside>
      </div>

      <aside
        className={`hidden shrink-0 flex-col border-r border-white/10 bg-ink p-3 md:sticky md:top-0 md:flex md:h-screen ${
          collapsed ? 'w-[68px]' : 'w-[210px]'
        }`}
      >
        <div
          className={`mb-5 mt-1 flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {collapsed ? null : (
            <Link href="/" aria-label="Future Baller home">
              <Wordmark className="text-xl" />
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <IconPanelLeft className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search pages"
          className={`mb-4 flex items-center rounded-lg text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white ${
            collapsed ? 'h-10 w-10 justify-center' : 'gap-2 px-3 py-2'
          }`}
        >
          <IconSearch className="h-4 w-4 shrink-0" />
          {collapsed ? null : (
            <>
              <span className="flex-1 truncate text-left">Search…</span>
              <kbd className="text-[11px] text-white/40">⌘K</kbd>
            </>
          )}
        </button>

        <div className="flex-1 overflow-y-auto">
          <NavItems sections={sections} collapsed={collapsed} unreadCount={unreadCount} />
        </div>
      </aside>
    </>
  );
}
