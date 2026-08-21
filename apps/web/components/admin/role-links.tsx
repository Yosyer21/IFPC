import Link from 'next/link';

export const ROLE_LINKS = [
  { role: 'PLAYER', label: 'Jugadores', href: '/dashboard/admin/users/players' },
  { role: 'PARENT', label: 'Familiares', href: '/dashboard/admin/users/parents' },
  { role: 'COACH', label: 'Entrenadores', href: '/dashboard/admin/users/coaches' },
  { role: 'SCOUT', label: 'Ojeadores', href: '/dashboard/admin/users/scouts' },
  { role: 'AGENT', label: 'Agentes', href: '/dashboard/admin/users/agents' },
  { role: 'CLUB', label: 'Clubes', href: '/dashboard/admin/users/clubs' },
  { role: 'UNIVERSITY', label: 'Universidades', href: '/dashboard/admin/users/universities' },
] as const;

export function RoleLinks() {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link
        href="/dashboard/admin/users"
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Todos
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
