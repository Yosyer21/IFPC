'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { PhotoUploadForm } from '@/components/account/photo-upload-form';
import { NotificationsBell } from '@/components/discovery/notifications-bell';
import { PlayerAvatar } from '@/components/player/avatar';
import type { FeedNotification } from '@/lib/discovery';
import { FALLBACK_NAV, NAV, type NavSection } from './nav';
import { ICONS, IconChevronDown, IconLogout, IconMenu, IconX } from './icons';

const STORAGE_KEY = 'fb.nav.sections';

function SidebarContent({
  sections,
  pathname,
  unreadCount,
  userName,
  userImage,
  notifications,
}: {
  sections: NavSection[];
  pathname: string;
  unreadCount?: number;
  userName: string;
  userImage?: string | null;
  notifications: FeedNotification[];
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
                    const itemActive = isActive(item.href);
                    const Icon = item.icon ? ICONS[item.icon] : undefined;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          itemActive
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

      {/* Cuenta: avatar del usuario, avisos y cambio de foto (válido para cualquier rol). */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2.5">
          <PlayerAvatar
            firstName={userName.trim().split(/\s+/)[0] ?? ''}
            lastName={userName.trim().split(/\s+/).at(-1) ?? ''}
            imageUrl={userImage}
            size="sm"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{userName}</div>
          </div>
        </div>
        <div className="mt-2">
          <NotificationsBell notifications={notifications} unread={unreadCount ?? 0} compact />
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
            Cambiar foto
          </summary>
          <div className="mt-3">
            <PhotoUploadForm
              name={userName}
              imageUrl={userImage}
              redirectTo={pathname}
              compact
            />
          </div>
        </details>
      </div>

      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <IconLogout className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </>
  );
}

export function DashboardSidebar({
  role,
  unreadCount,
  userName,
  userImage,
  notifications,
}: {
  role: string;
  unreadCount?: number;
  userName: string;
  userImage?: string | null;
  notifications: FeedNotification[];
}) {
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
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0b0f0d]/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:bg-white/5"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-gradient-brand text-base font-black tracking-tight">
          Future Baller
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
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto border-r border-white/10 bg-[#0b0f0d]/95 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="text-gradient-brand text-lg font-black tracking-tight">
                Future Baller
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:bg-white/5"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              sections={sections}
              pathname={pathname}
              unreadCount={unreadCount}
              userName={userName}
              userImage={userImage}
              notifications={notifications}
            />
          </aside>
        </div>
      ) : null}

      {/* Sidebar de escritorio */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl md:flex md:flex-col">
        <Link href="/" className="text-gradient-brand mb-6 block text-lg font-black tracking-tight">
          Future Baller
        </Link>
        <SidebarContent
          sections={sections}
          pathname={pathname}
          unreadCount={unreadCount}
          userName={userName}
          userImage={userImage}
          notifications={notifications}
        />
      </aside>
    </>
  );
}

