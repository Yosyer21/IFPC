import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { createCampAction } from '@/app/actions/admin';
import { CAMP_STATUS_LABELS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Nuevo camp' };

export default async function AdminCampCreatePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [coaches, clubs] = await Promise.all([
    prisma.coach.findMany({
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
      take: 100,
    }),
    prisma.club.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nuevo camp"
        subtitle="Crea un campus, clinic o concentración"
        icon="trophy"
      >
        <Link
          href="/dashboard/admin/camps"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Camps
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          <form action={createCampAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Título *
              <input
                required
                name="title"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Campus de verano…"
              />
            </label>
            <label className="text-sm">
              Estado
              <select
                name="status"
                defaultValue="OPEN"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {Object.entries(CAMP_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Descripción
              <textarea
                name="description"
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Objetivos, metodología, plazas…"
              />
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
            <label className="text-sm">
              País
              <input
                name="country"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="España"
              />
            </label>
            <label className="text-sm">
              Ciudad
              <input
                name="city"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Madrid"
              />
            </label>
            <label className="text-sm">
              Plazas (capacidad)
              <input
                type="number"
                name="capacity"
                min={1}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Precio (en céntimos, 29900 = 299 €)
              <input
                type="number"
                name="price"
                min={0}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Entrenador responsable
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
              Club organizador
              <select name="clubId" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">Sin asignar</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2"
            >
              Crear camp
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


