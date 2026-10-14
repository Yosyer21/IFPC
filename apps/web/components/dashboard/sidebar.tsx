'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip } from '@ifpc/ui';
import { ICONS, IconChevronDown, IconPanelLeft, IconSearch, IconX } from './icons';
import type { NavSection } from './nav';

const STORAGE_KEY = 'fb.nav.sections';

/** Áreas de rol: la portada `/dashboard/<rol>` es prefijo de todas sus subpáginas. */
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
  // La portada del rol (p. ej. `/dashboard/player`) se marca activa **solo** en
  // ella misma: al ser prefijo de todas sus subpáginas, si no quedaría
  // seleccionada siempre y el menú mostraría dos items activos a la vez.
  const areaRoot = /^\/dashboard\/([^/]+)$/.exec(href)?.[1];
  if (areaRoot && ROLE_AREAS.has(areaRoot)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Carácter propio de cada icono de navegación (clases en `globals.css`): al pasar
 * el puntero el icono se mueve y se enciende en lima, y el del item activo
 * "respira". Cada familia de icono tiene su gesto para que la barra esté viva.
 */
const ICON_MOTION: Record<string, string> = {
  live: 'nav-icon-spin',
  compass: 'nav-icon-turn',
  settings: 'nav-icon-turn',
  bell: 'nav-icon-swing',
  sparkles: 'nav-icon-float',
  search: 'nav-icon-pop',
  star: 'nav-icon-pop',
  trophy: 'nav-icon-pop',
  target: 'nav-icon-pop',
  chart: 'nav-icon-pop',
  whistle: 'nav-icon-pop',
  check: 'nav-icon-pop',
  play: 'nav-icon-pop',
};

function motionFor(icon?: string): string {
  return icon ? (ICON_MOTION[icon] ?? '') : '';
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
                      data-active={active ? 'true' : undefined}
                      className={`nav-item relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? 'text-brand'
                          : 'text-muted-foreground hover:bg-brand/10 hover:text-brand'
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="nav-bar absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-brand"
                        />
                      ) : null}
                      {Icon ? (
                        <Icon className={`nav-icon h-5 w-5 ${motionFor(item.icon)}`} />
                      ) : (
                        <span className="h-5 w-5" />
                      )}
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
                active ? 'text-brand' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                      data-active={itemActive ? 'true' : undefined}
                      className={`nav-item relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        itemActive
                          ? 'font-medium text-brand'
                          : 'text-muted-foreground hover:bg-brand/10 hover:text-brand'
                      }`}
                    >
                      {itemActive ? (
                        <span
                          aria-hidden="true"
                          className="nav-bar absolute inset-y-1 left-0 w-[3px] rounded-full bg-brand"
                        />
                      ) : null}
                      {Icon ? (
                        <Icon className={`nav-icon h-4 w-4 shrink-0 ${motionFor(item.icon)}`} />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )}
                      <span className="nav-label flex-1 truncate">{item.label}</span>
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
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto border-r border-border bg-ink p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="text-gradient-brand text-lg font-black tracking-tight">
                Future Baller
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand"
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
        className={`hidden shrink-0 flex-col border-r border-border bg-ink p-3 md:sticky md:top-0 md:flex md:h-screen ${
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
            className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand"
          >
            <IconPanelLeft className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search pages"
          className={`nav-item mb-3 flex items-center rounded-lg text-sm text-muted-foreground transition-colors hover:text-brand ${
            collapsed ? 'h-10 w-10 justify-center' : 'gap-2 px-3 py-2'
          }`}
        >
          <IconSearch className="nav-icon nav-icon-pop h-4 w-4 shrink-0" />
          {collapsed ? null : (
            <>
              <span className="flex-1 truncate text-left">Search…</span>
              <kbd className="px-1.5 py-0.5 text-[10px] text-muted-foreground/70">⌘K</kbd>
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
