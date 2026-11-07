'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROLE_LINKS = [
  { role: 'PLAYER', label: 'Players', href: '/dashboard/admin/users/players' },
  { role: 'PARENT', label: 'Families', href: '/dashboard/admin/users/parents' },
  { role: 'COACH', label: 'Coaches', href: '/dashboard/admin/users/coaches' },
  { role: 'SCOUT', label: 'Scouts', href: '/dashboard/admin/users/scouts' },
  { role: 'AGENT', label: 'Agents', href: '/dashboard/admin/users/agents' },
  { role: 'CLUB', label: 'Clubs', href: '/dashboard/admin/users/clubs' },
  { role: 'UNIVERSITY', label: 'Universities', href: '/dashboard/admin/users/universities' },
  { role: 'SCHOOL', label: 'Schools / Community', href: '/dashboard/admin/users/schools' },
] as const;

const PILL_ACTIVE = 'rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white';
const PILL_INACTIVE =
  'rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

/** Filtros por rol como pills; el activo va relleno en tinta. */
export function RoleLinks() {
  const pathname = usePathname();
  const allHref = '/dashboard/admin/users';
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link href={allHref} className={pathname === allHref ? PILL_ACTIVE : PILL_INACTIVE}>
        All
      </Link>
      {ROLE_LINKS.map((link) => (
        <Link
          key={link.role}
          href={link.href}
          className={pathname === link.href ? PILL_ACTIVE : PILL_INACTIVE}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
