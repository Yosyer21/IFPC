import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { StatusBadge } from '@/components/admin/status-badge';
import {
  IconCalendar,
  IconCheckCircle,
  IconTrophy,
  IconUsers,
} from '@/components/dashboard/icons';
import { changeCampStatusAction, deleteCampAction } from '@/app/actions/admin';

export const metadata: Metadata = { title: 'Camps' };

export const CAMP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  FULL: 'Completo',
  CANCELLED: 'Cancelado',
  FINISHED: 'Finalizado',
};

export default async function AdminCampsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const camps = await prisma.camp.findMany({
    include: {
      coach: { include: { user: true } },
      club: true,
      registrations: true,
    },
    orderBy: { startsAt: 'asc' },
    take: 100,
  });

  const open = camps.filter((camp) => camp.status === 'OPEN').length;
  const registrations = camps.reduce((sum, camp) => sum + camp.registrations.length, 0);
  const capacity = camps.reduce(
    (sum, camp) => sum + (camp.capacity ?? camp.registrations.length),
    0
  );
  const occupancy = capacity > 0 ? Math.round((registrations / capacity) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Camps"
        subtitle="Campus, clinics y concentraciones organizadas por clubes y entrenadores"
        icon="trophy"
      >
        <Link
          href="/dashboard/admin/camps/create"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Nuevo camp
        </Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard href="/dashboard/admin/camps" icon={IconTrophy} label="Total camps" value={camps.length} />
        <StatCard href="/dashboard/admin/camps" icon={IconCheckCircle} label="Abiertos" value={open} />
        <StatCard href="/dashboard/admin/camps" icon={IconUsers} label="Inscripciones" value={registrations} />
        <StatCard href="/dashboard/admin/camps" icon={IconCalendar} label="Ocupación" value={occupancy} suffix="%" />
      </div>

      {camps.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay camps creados todavía. Crea el primero para abrir inscripciones.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {/* CAMP_ROWS */}
          {camps.map((camp) => (
            <Card key={camp.id} className="card-hover">
              <CardContent className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/admin/camps/${camp.id}`}
                      className="font-semibold hover:underline"
                    >
                      {camp.title}
                    </Link>
                    <StatusBadge status={camp.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {camp.startsAt.toLocaleDateString('es')}
                    {camp.endsAt ? ` → ${camp.endsAt.toLocaleDateString('es')}` : ''}
                    {camp.city ? ` · ${camp.city}` : ''}
                    {camp.country ? `, ${camp.country}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {camp.coach?.user?.name ? (
                      <Badge variant="outline">Coach: {camp.coach.user.name}</Badge>
                    ) : null}
                    {camp.club?.name ? (
                      <Badge variant="outline">Club: {camp.club.name}</Badge>
                    ) : null}
                    <Badge variant="outline">
                      {camp.registrations.length}/{camp.capacity ?? '∞'} plazas
                    </Badge>
                    {camp.price ? (
                      <Badge variant="outline">
                        {(camp.price / 100).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: camp.currency.toUpperCase(),
                        })}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <form action={changeCampStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="campId" value={camp.id} />
                  <select
                    name="status"
                    defaultValue={camp.status}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    {Object.entries(CAMP_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-muted"
                  >
                    Actualizar
                  </button>
                </form>

                <form action={deleteCampAction}>
                  <input type="hidden" name="campId" value={camp.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Eliminar
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

