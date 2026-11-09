'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ICONS } from '@/components/dashboard/icons';

/** Sub-secciones del Profile center. */
const TABS = [
  { href: '/dashboard/player/profile-center/profile', label: 'My profile', icon: 'user' },
  { href: '/dashboard/player/profile-center/id', label: 'Player ID', icon: 'file' },
  {
    href: '/dashboard/player/profile-center/development',
    label: 'My development',
    icon: 'trending',
  },
] as const;

/**
 * Tabs de navegación del Profile center: enlaces reales (no estado local), así
 * cada sección conserva su URL, se puede compartir y el botón atrás funciona.
 */
export function ProfileCenterTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Profile center sections"
      className="flex flex-wrap gap-1 rounded-full border border-border bg-muted/70 p-1"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = ICONS[tab.icon];

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? 'bg-ink text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
