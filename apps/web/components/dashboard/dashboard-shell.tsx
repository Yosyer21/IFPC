'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { FeedNotification } from '@/lib/discovery';
import { CommandPalette } from './command-palette';
import { DashboardHeader } from './header';
import { DashboardSidebar } from './sidebar';
import { FALLBACK_NAV, NAV } from './nav';

/**
 * Orquestador del área privada (cliente): mantiene el estado compartido entre
 * sidebar (drawer móvil + rail colapsable) y header (búsqueda ⌘K), y resuelve la
 * navegación del rol.
 */
export function DashboardShell({
  role,
  userName,
  userImage,
  unreadCount,
  notifications,
  children,
}: {
  role: string;
  userName: string;
  userImage?: string | null;
  unreadCount?: number;
  notifications: FeedNotification[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sections = NAV[role] ?? FALLBACK_NAV;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cierra el drawer al navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Estado del rail persistido entre visitas.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem('fb.nav.collapsed') === '1');
    } catch {
      // sin localStorage: se queda expandido
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem('fb.nav.collapsed', next ? '1' : '0');
      } catch {
        // sin persistencia
      }
      return next;
    });
  };

  // Atajo global ⌘K / Ctrl+K para la búsqueda de páginas.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div
        className="app-ambient pointer-events-none fixed inset-0 -z-10 bg-ink"
        aria-hidden="true"
      />

      <DashboardSidebar
        sections={sections}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
        unreadCount={unreadCount}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          role={role}
          userName={userName}
          userImage={userImage}
          unreadCount={unreadCount}
          notifications={notifications}
          onOpenMenu={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} sections={sections} />
    </div>
  );
}
