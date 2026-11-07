'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Search, ChevronDown, LayoutDashboard, IdCard, CalendarDays, TrendingUp,
  ArrowLeftRight, Star, Play, Video, Activity, FileText, Radio, Bell,
  Settings, Menu, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PreviewShellProps {
  active: 'profile' | 'calendar';
  userName?: string;
  searchPlaceholder?: string;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  key?: 'profile' | 'calendar';
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { href: '#', label: 'Overview', icon: LayoutDashboard },
      { href: '/preview/player-profile', label: 'Player ID', icon: IdCard, key: 'profile' },
      { href: '/preview/calendar', label: 'Calendar', icon: CalendarDays, key: 'calendar' },
      { href: '#', label: 'My development', icon: TrendingUp },
    ],
  },
  {
    label: 'My career',
    items: [
      { href: '#', label: 'Transfer window', icon: ArrowLeftRight },
      { href: '#', label: 'Scouting profile', icon: Search },
      { href: '#', label: 'Membership', icon: Star },
    ],
  },
  {
    label: 'Train',
    items: [
      { href: '#', label: 'Training', icon: Play },
      { href: '#', label: 'Film room', icon: Video },
      { href: '#', label: 'The "1%" factor', icon: Activity },
      { href: '#', label: 'My documents', icon: FileText },
      { href: '#', label: 'Live sessions', icon: Radio },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '#', label: 'Notifications', icon: Bell },
      { href: '#', label: 'Settings', icon: Settings },
    ],
  },
];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'DP'
  );
}

export function PreviewShell({
  active,
  userName = 'Demo Player',
  searchPlaceholder = 'Search…',
  children,
}: PreviewShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#111] font-sans">
      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto bg-[#0a0a0a] p-4 transition-transform md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2 pb-6 pt-2">
          <div>
            <p className="text-lg font-black leading-none tracking-tight text-white">FUTURE BALLER</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7b7b7b]">Player</p>
          </div>
          <button
            type="button"
            className="text-white/60 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5e5e5e]">
                {section.label}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = active === item.key;
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={
                          isActive
                            ? 'flex items-center gap-3 rounded-full bg-[#d1fc2a] px-3.5 py-2.5 text-sm font-semibold text-[#0a0a0a]'
                            : 'flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm text-[#9aa0a6] transition-colors hover:bg-white/5 hover:text-white'
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/5 bg-white px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f1f2f4] md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              aria-label="Search"
              className="h-10 w-full rounded-full border border-transparent bg-[#f1f2f4] pl-10 pr-4 text-sm text-[#111] outline-none placeholder:text-[#9aa0a6] focus:border-[#d1fc2a] focus:bg-white"
            />
          </div>

          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[#f1f2f4]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d1fc2a] text-xs font-bold text-[#0a0a0a]">
                {initials(userName)}
              </span>
              <span className="hidden text-sm font-medium text-[#111] sm:block">{userName}</span>
              <ChevronDown className="h-4 w-4 text-[#6b7280]" />
            </button>
            {userOpen ? (
              <div className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-1 shadow-lg">
                {['Overview', 'My profile', 'Settings', 'Sign out'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#f1f2f4]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
