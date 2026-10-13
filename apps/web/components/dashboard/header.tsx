'use client';

import Link from 'next/link';
import { Dropdown } from '@ifpc/ui';
import { signOutAction } from '@/app/actions/auth';
import { NotificationsBell } from '@/components/discovery/notifications-bell';
import { PlayerAvatar } from '@/components/player/avatar';
import type { FeedNotification } from '@/lib/discovery';
import { IconChevronDown, IconLogout, IconMenu, IconSearch } from './icons';

const ROLE_LABELS: Record<string, string> = {
  player: 'Player',
  parent: 'Family',
  coach: 'Coach',
  scout: 'Scout',
  agent: 'Agent',
  club: 'Club',
  university: 'University',
  school: 'School',
  admin: 'Admin',
};

const PROFILE_PATHS: Record<string, string> = {
  player: '/dashboard/player/profile',
  club: '/dashboard/club/profile',
  university: '/dashboard/university/profile',
  school: '/dashboard/school/profile',
};

const SETTINGS_PATHS: Record<string, string> = {
  player: '/dashboard/player/settings',
  parent: '/dashboard/parent/settings',
  admin: '/dashboard/admin/settings',
};

const itemClass =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground';

/**
 * Barra superior del área privada: menú móvil, búsqueda global (⌘K), avisos y
 * menú de usuario. Sustituye al bloque de cuenta que vivía al fondo del sidebar.
 */
export function DashboardHeader({
  role,
  userName,
  userImage,
  unreadCount,
  notifications,
  onOpenMenu,
  onOpenSearch,
}: {
  role: string;
  userName: string;
  userImage?: string | null;
  unreadCount?: number;
  notifications: FeedNotification[];
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}) {
  const firstName = userName.trim().split(/\s+/)[0] ?? '';
  const lastName = userName.trim().split(/\s+/).at(-1) ?? '';
  const roleLabel = ROLE_LABELS[role] ?? 'Member';
  const profileHref = PROFILE_PATHS[role];
  const settingsHref = SETTINGS_PATHS[role];

  return (
    <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-[#0b0f0d] px-4 py-3">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:hidden"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <Link href="/" className="text-gradient-brand text-base font-black tracking-tight md:hidden">
        Future Baller
      </Link>

      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground md:inline-flex"
      >
        <IconSearch className="h-4 w-4" />
        Search pages…
        <kbd className="ml-3 rounded border border-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <div className="flex-1" />

      <NotificationsBell notifications={notifications} unread={unreadCount ?? 0} />

      <Dropdown
        align="right"
        trigger={
          <span className="flex items-center gap-2 rounded-full border border-border bg-white/5 py-1 pl-1 pr-2 transition-colors hover:bg-white/10">
            <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={userImage} size="sm" />
            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{userName}</span>
            <IconChevronDown className="h-4 w-4 text-muted-foreground" />
          </span>
        }
      >
        <div className="px-3 py-2">
          <p className="max-w-56 truncate text-sm font-medium text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <div className="my-1 h-px bg-white/10" />
        <Link href={`/dashboard/${role}`} className={itemClass}>
          Overview
        </Link>
        {profileHref ? (
          <Link href={profileHref} className={itemClass}>
            My profile
          </Link>
        ) : null}
        {settingsHref ? (
          <Link href={settingsHref} className={itemClass}>
            Settings
          </Link>
        ) : null}
        <div className="my-1 h-px bg-white/10" />
        <form action={signOutAction}>
          <button type="submit" className={itemClass}>
            <IconLogout className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </Dropdown>
    </header>
  );
}
