'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip } from '@ifpc/ui';
import { ICONS, IconChevronDown, IconPanelLeft, IconSearch, IconX } from './icons';
import type { NavSection } from './nav';

const STORAGE_KEY = 'fb.nav.sections';

function isActiveHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Lista de navegación. En modo `collapsed` se pinta como rail de iconos con
 * tooltip; en modo expandido, secciones colapsables con iconos y el item activo
 * marcado con `aria-current="page"`.
 */
function NavItems({
  sections,
  collapsed,
  unreadCount,
}: {
  sections: NavSection[];
  collapsed: boolean;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Estado inicial de las secciones desde localStorage (colapsadas por defecto).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOpenSections(JSON.parse(raw));
    } catch {
      // localStorage no disponible: se ignoran las preferencias.
    }
  }, []);

  const sectionHasActive = (section: NavSection) =>
    section.items.some((item) => isActiveHref(pathname, item.href));

  // La sección de la página actual se abre automáticamente al navegar.
  useEffect(() => {
    setOpenSections((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const section of sections) {
        if (sectionHasActive(section) && !next[section.label]) {
          next[section.label] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Sin persistencia en entornos sin localStorage.
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <nav className="flex flex-col" aria-label="Main navigation">
        {sections.map((section, index) => (
          <div
            key={section.label}
            className={index > 0 ? 'mt-2 border-t border-white/5 pt-2' : undefined}
          >
            <div className="flex flex-col items-center gap-1">
              {section.items.map((item) => {
                const Icon = item.icon ? ICONS[item.icon] : undefined;
                const active = isActiveHref(pathname, item.href);
                return (
                  <Tooltip key={item.href} content={item.label}>
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? 'chip-gradient'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      {Icon ? <Icon className="h-5 w-5" /> : <span className="h-5 w-5" />}
                    </Link>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-4" aria-label="Main navigation">
      {sections.map((section) => {
        const open = Boolean(openSections[section.label]);
        const active = sectionHasActive(section);
        return (
          <div key={section.label}>
            <button
              type="button"
              onClick={() => toggleSection(section.label)}
              aria-expanded={open}
              className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                active
                  ? 'text-emerald-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {section.label}
              <IconChevronDown
                className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open ? (
              <div className="mt-0.5 flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const itemActive = isActiveHref(pathname, item.href);
                  const Icon = item.icon ? ICONS[item.icon] : undefined;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={itemActive ? 'page' : undefined}
                      className={`relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        itemActive
                          ? 'chip-gradient font-medium'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      {itemActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-emerald-400"
                        />
                      ) : null}
                      {Icon ? (
                        <Icon className="h-4 w-4 shrink-0" />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.href.includes('/notifications') && unreadCount ? (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
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
  // Cierra el drawer móvil con Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMobile();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Drawer móvil (controlado desde el shell/header). */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto border-r border-border bg-[#0b0f0d] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="text-gradient-brand text-lg font-black tracking-tight">
                Future Baller
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <NavItems sections={sections} collapsed={false} unreadCount={unreadCount} />
          </aside>
        </div>
      ) : null}

      {/* Sidebar de escritorio: rail colapsable con estado persistente. */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-border bg-[#0a0e0c] p-3 md:sticky md:top-0 md:flex md:h-screen ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        <div
          className={`mb-4 flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {collapsed ? null : (
            <Link href="/" className="text-gradient-brand text-lg font-black tracking-tight">
              Future Baller
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className="rounded-lg border border-white/10 p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <IconPanelLeft className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search pages"
          className={`mb-3 flex items-center rounded-lg border border-white/10 bg-white/5 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground ${
            collapsed ? 'h-10 w-10 justify-center' : 'gap-2 px-3 py-2'
          }`}
        >
          <IconSearch className="h-4 w-4 shrink-0" />
          {collapsed ? null : (
            <>
              <span className="flex-1 truncate text-left">Search…</span>
              <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
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
