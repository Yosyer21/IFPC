import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { createCoachLiveSessionAction } from '@/app/actions/coach';
import { SESSION_TYPE_LABELS } from '@/app/dashboard/player/live-sessions/page';

export const metadata: Metadata = { title: 'Sesiones en vivo' };

export default async function CoachLiveSessionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) notFound();

  const sessions = await prisma.liveSession.findMany({
    where: { coachId: coach.id },
    include: { player: { include: { user: true } } },
    orderBy: { startsAt: 'asc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Sesiones en vivo"
        subtitle="Tus entrenamientos en directo, charlas y pruebas con jugadores"
        icon="live"
      />

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-3 font-semibold">Programar nueva sesión</h2>
          <form action={createCoachLiveSessionAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Título *
              <input
                required
                name="title"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Entrenamiento en directo…"
              />
            </label>
            <label className="text-sm">
              Tipo
              <select name="type" defaultValue="TRAINING" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
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
              Enlace de reunión
              <input
                name="meetingUrl"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="https://meet.google.com/…"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2"
            >
              Programar
            </button>
          </form>
        </CardContent>
      </Card>

      {sessions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Todavía no has programado sesiones en vivo. Usa el formulario para crear la primera.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((liveSession) => (
            <div
              key={liveSession.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span>{liveSession.title}</span>
                  <StatusBadge status={liveSession.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type} ·{' '}
                  {liveSession.startsAt.toLocaleDateString('es')}{' '}
                  {liveSession.startsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  {liveSession.player
                    ? ` · 1:1 con ${liveSession.player.firstName} ${liveSession.player.lastName}`
                    : ''}
                </div>
              </div>
              {liveSession.meetingUrl ? (
                <Badge variant="outline">Enlace listo</Badge>
              ) : (
                <Badge variant="outline">Sin enlace</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



