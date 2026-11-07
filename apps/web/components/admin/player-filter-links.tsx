'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard/admin/players', label: 'All' },
  { href: '/dashboard/admin/players/pending', label: 'Pending' },
  { href: '/dashboard/admin/players/active', label: 'Active' },
];

const PILL_ACTIVE = 'rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white';
const PILL_INACTIVE =
  'rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

/** Filtros de la lista de jugadores como pills; el activo va relleno en tinta. */
export function PlayerFilterLinks() {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? PILL_ACTIVE : PILL_INACTIVE}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
