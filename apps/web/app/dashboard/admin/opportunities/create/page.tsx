import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { createOpportunityAction } from '@/app/actions/admin';

export const metadata: Metadata = { title: 'Nueva oportunidad' };

export default async function AdminOpportunityCreatePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [clubs, universities] = await Promise.all([
    prisma.club.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 100,
    }),
    prisma.university.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nueva oportunidad"
        subtitle="Publica una oportunidad en nombre de un club o universidad"
        icon="target"
      >
        <Link href="/dashboard/admin/opportunities" className="text-sm text-muted-foreground hover:underline">
          ← Oportunidades
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          <form action={createOpportunityAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Título *
              <input
                required
                name="title"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Prueba para juvenil Sub-17…"
              />
            </label>
            <label className="text-sm">
              Publicado por
              <select name="creatorType" defaultValue="CLUB" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="CLUB">Club</option>
                <option value="UNIVERSITY">Universidad</option>
              </select>
            </label>
            <label className="text-sm">
              Tipo
              <select name="type" defaultValue="TRIAL" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="TRIAL">Prueba</option>
                <option value="SCOUTING">Scouting</option>
                <option value="CONTRACT">Contrato</option>
                <option value="SCHOLARSHIP">Beca</option>
                <option value="ACADEMY">Academia</option>
              </select>
            </label>
            <label className="text-sm">
              Club
              <select name="clubId" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">Sin asignar</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Universidad
              <select name="universityId" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">Sin asignar</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Posición
              <input name="position" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" placeholder="DEL" />
            </label>
            <label className="text-sm">
              Ubicación
              <input name="location" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Madrid" />
            </label>
            <label className="text-sm">
              Edad mínima
              <input type="number" name="ageMin" min={5} max={40} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm">
              Edad máxima
              <input type="number" name="ageMax" min={5} max={45} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm">
              Estado
              <select name="status" defaultValue="OPEN" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="DRAFT">Borrador</option>
                <option value="OPEN">Abierta</option>
                <option value="CLOSED">Cerrada</option>
              </select>
            </label>
            <label className="text-sm">
              Cierra el
              <input type="date" name="closesAt" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm sm:col-span-2">
              Descripción
              <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2"
            >
              Publicar oportunidad
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


