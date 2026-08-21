import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@future-buller/database';
import { Badge } from '@future-buller/ui';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Clubes — Future Buller',
  description: 'Directorio de clubes y academias que reclutan en Future Buller.',
};

export default async function PublicClubsPage() {
  const clubs = await prisma.club.findMany({
    where: { verified: true },
    include: { _count: { select: { opportunities: true } } },
    orderBy: { name: 'asc' },
    take: 100,
  });

  const countries = new Set(clubs.map((club) => club.country)).size;

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Clubs</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Clubes que reclutan</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {clubs.length} clubes verificados · {countries} países. Publican pruebas, becas y
            convocatorias en la plataforma.
          </p>
        </div>

        {clubs.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <p className="text-muted-foreground">Aún no hay clubes verificados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-bold text-emerald-400">
                    {club.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold group-hover:text-emerald-400">
                      {club.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {club.city ? `${club.city}, ` : ''}
                      {club.country}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {club.league ? <Badge variant="outline">{club.league}</Badge> : null}
                  <Badge variant="outline">{club._count.opportunities} oportunidades</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


