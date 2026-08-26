'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { FALLBACK_NAV, NAV, type NavSection } from './nav';
import { ICONS, IconChevronDown, IconLogout, IconMenu, IconX } from './icons';

const STORAGE_KEY = 'fb.nav.sections';

function SidebarContent({
  sections,
  pathname,
  unreadCount,
}: {
  sections: NavSection[];
  pathname: string;
  unreadCount?: number;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Estado inicial desde localStorage (secciones colapsadas por defecto).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOpenSections(JSON.parse(raw));
    } catch {
      // localStorage no disponible: se ignoran las preferencias.
    }
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const sectionHasActive = (section: NavSection) =>
    section.items.some((item) => isActive(item.href));

  // The current page section opens automatically when navigating.
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

  return (
    <>
      <nav className="flex-1 space-y-4">
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
                    ? 'text-primary'
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
                    const itemActive = isActive(item.href);
                    const Icon = item.icon ? ICONS[item.icon] : undefined;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                          itemActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
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

      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <IconLogout className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </>
  );
}

export function DashboardSidebar({ role, unreadCount }: { role: string; unreadCount?: number }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = NAV[role] ?? FALLBACK_NAV;

  // Closes the mobile drawer when navigating.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top bar on mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-muted"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-base font-bold">
          IFPC
        </Link>
        <span className="w-9" />
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto border-r border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="text-lg font-bold">
                IFPC
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-muted"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent sections={sections} pathname={pathname} unreadCount={unreadCount} />
          </aside>
        </div>
      ) : null}

      {/* Sidebar de escritorio */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-card p-4 md:flex md:flex-col">
        <Link href="/" className="mb-6 block text-lg font-bold">
          IFPC
        </Link>
        <SidebarContent sections={sections} pathname={pathname} unreadCount={unreadCount} />
      </aside>
    </>
  );
}

