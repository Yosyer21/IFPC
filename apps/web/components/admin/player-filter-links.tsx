import Link from 'next/link';

export function PlayerFilterLinks() {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link
        href="/dashboard/admin/players"
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        All
      </Link>
      <Link
        href="/dashboard/admin/players/pending"
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Pending
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
