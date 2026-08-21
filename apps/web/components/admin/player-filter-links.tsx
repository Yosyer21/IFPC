import Link from 'next/link';

export function PlayerFilterLinks() {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link
        href="/dashboard/admin/players"
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Todos
      </Link>
      <Link
        href="/dashboard/admin/players/pending"
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Pendientes
      </Link>
      <Link
        href="/dashboard/admin/players/active"
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Activos
      </Link>
    </div>
  );
}
