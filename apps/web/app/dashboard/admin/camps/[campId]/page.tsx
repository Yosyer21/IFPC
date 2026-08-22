import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { IconUsers } from '@/components/dashboard/icons';
import { changeCampStatusAction } from '@/app/actions/admin';
import { CAMP_STATUS_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Detalle del camp' };

export default async function AdminCampDetailPage({
  params,
}: {
  params: Promise<{ campId: string }>;
}) {
  const { campId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    include: {
      coach: { include: { user: true } },
      club: true,
      registrations: { include: { player: { include: { user: true } } } },
    },
  });
  if (!camp) notFound();

  const occupancy =
    camp.capacity && camp.capacity > 0
      ? Math.round((camp.registrations.length / camp.capacity) * 100)
      : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={camp.title}
        subtitle={`${camp.city ?? '—'}${camp.country ? `, ${camp.country}` : ''}`}
        icon="trophy"
      >
        <Link href="/dashboard/admin/camps" className="text-sm text-muted-foreground hover:underline">
          ← Camps
        </Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Estado</div>
            <div className="mt-1">
              <StatusBadge status={camp.status} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Fechas</div>
            <div className="mt-1 text-sm font-semibold">
              {camp.startsAt.toLocaleDateString('es')}
              {camp.endsAt ? ` → ${camp.endsAt.toLocaleDateString('es')}` : ''}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Precio</div>
            <div className="mt-1 text-sm font-semibold">
              {camp.price
                ? (camp.price / 100).toLocaleString('es-ES', {
                    style: 'currency',
                    currency: camp.currency.toUpperCase(),
                  })
                : 'Gratuito'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Ocupación</div>
            <div className="mt-1 text-sm font-semibold">
              {camp.registrations.length}/{camp.capacity ?? '∞'} {occupancy !== null ? `(${occupancy}%)` : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-2 font-semibold">Descripción</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {camp.description ?? 'Sin descripción.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {camp.coach?.user?.name ? (
              <Badge variant="outline">Coach: {camp.coach.user.name}</Badge>
            ) : null}
            {camp.club?.name ? <Badge variant="outline">Club: {camp.club.name}</Badge> : null}
          </div>
          <form action={changeCampStatusAction} className="mt-4 flex items-center gap-2">
            <input type="hidden" name="campId" value={camp.id} />
            <select
              name="status"
              defaultValue={camp.status}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              {Object.entries(CAMP_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Actualizar estado
            </button>
          </form>
        </CardContent>
      </Card>

      {/* REGISTRATIONS */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <IconUsers className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Inscripciones ({camp.registrations.length})</h2>
          </div>
          {camp.registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay jugadores inscritos en este camp.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {camp.registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {registration.player.firstName} {registration.player.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {registration.player.position ?? 'Sin posición'} ·{' '}
                      {registration.createdAt.toLocaleDateString('es')}
                    </div>
                  </div>
                  <StatusBadge status={registration.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


