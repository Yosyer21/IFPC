import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { createLiveSessionAction } from '@/app/actions/admin';
import { LIVE_SESSION_STATUS_LABELS, LIVE_SESSION_TYPE_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'New live session' };

export default async function AdminLiveSessionCreatePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [coaches, players] = await Promise.all([
    prisma.coach.findMany({
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
      take: 100,
    }),
    prisma.player.findMany({
      include: { user: true },
      orderBy: { firstName: 'asc' },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New live session"
        subtitle="Organiza un entrenamiento en directo, charla o prueba"
        icon="live"
      >
        <Link
          href="/dashboard/admin/live-sessions"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Sesiones en vivo
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          <form action={createLiveSessionAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Title *
              <input
                required
                name="title"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Entrenamiento en directo…"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea
                name="description"
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Tipo
              <select
                name="type"
                defaultValue="TRAINING"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {Object.entries(LIVE_SESSION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Estado
              <select
                name="status"
                defaultValue="SCHEDULED"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {Object.entries(LIVE_SESSION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Inicio *
              <input
                required
                type="datetime-local"
                name="startsAt"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Fin
              <input
                type="datetime-local"
                name="endsAt"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Meeting link (Zoom/Meet)
              <input
                name="meetingUrl"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="https://meet.google.com/…"
              />
            </label>
            <label className="text-sm">
              Entrenador
              <select name="coachId" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">Sin asignar</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.user.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Jugador (1:1)
              <select name="playerId" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">Grupo / sin jugador</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.firstName} {player.lastName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2"
            >
              Create session
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


