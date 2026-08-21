import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@future-buller/database';
import { Badge } from '@future-buller/ui';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Camps — Future Buller',
  description: 'Campus de fútbol, clinics y concentraciones organizados por clubes y entrenadores.',
};

export default async function PublicCampsPage() {
  const camps = await prisma.camp.findMany({
    where: { status: { in: ['OPEN', 'FULL'] } },
    include: { coach: { include: { user: true } }, club: true, registrations: true },
    orderBy: { startsAt: 'asc' },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Camps</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Campus, clinics y concentraciones
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Entrenamientos intensivos organizados por clubes y entrenadores. Plazas limitadas con
            seguimiento individualizado.
          </p>
        </div>

        {camps.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No hay camps abiertos en este momento. Vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {camps.map((camp) => {
              const spotsLeft = camp.capacity
                ? Math.max(0, camp.capacity - camp.registrations.length)
                : null;
              return (
                <Link
                  key={camp.id}
                  href={`/camps/${camp.id}`}
                  className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{camp.status === 'FULL' ? 'Completo' : 'Abierto'}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {camp.startsAt.toLocaleDateString('es')}
                      {camp.endsAt ? ` → ${camp.endsAt.toLocaleDateString('es')}` : ''}
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold group-hover:text-emerald-400">
                    {camp.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {camp.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {camp.city ?? '—'}
                      {camp.country ? `, ${camp.country}` : ''}
                    </span>
                    {camp.price ? (
                      <span className="font-semibold text-emerald-400">
                        {(camp.price / 100).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: camp.currency.toUpperCase(),
                        })}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400">Gratuito</span>
                    )}
                  </div>
                  {spotsLeft !== null ? (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {spotsLeft > 0 ? `${spotsLeft} plazas disponibles` : 'Sin plazas libres'}
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


