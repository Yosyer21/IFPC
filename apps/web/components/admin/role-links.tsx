import Link from 'next/link';

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

export function RoleLinks() {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link
        href="/dashboard/admin/users"
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        All
      </Link>
      {ROLE_LINKS.map((link) => (
        <Link
          key={link.role}
          href={link.href}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
