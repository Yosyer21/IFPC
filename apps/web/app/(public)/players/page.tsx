import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Jugadores — IFPC',
  description: 'Descubre jugadores disponibles con perfil deportivo verificado en IFPC.',
};

export default async function PublicPlayersPage() {
  const players = await prisma.player.findMany({
    where: { status: { in: ['AVAILABLE', 'ACTIVE'] } },
    include: { user: true },
    orderBy: { updatedAt: 'desc' },
    take: 120,
  });

  const countries = new Set(players.map((p) => p.nationality).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Jugadores</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Talento disponible</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {players.length} jugadores con perfil abierto · {countries} nacionalidades. Contacta con
            ellos vía plataforma.
          </p>
        </div>

        {players.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <p className="text-muted-foreground">
              Todavía no hay jugadores con perfil público.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-400">
                    {player.firstName[0]}
                    {player.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold group-hover:text-emerald-400">
                      {player.firstName} {player.lastName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {player.nationality ?? 'Nacionalidad no indicada'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    {player.position
                      ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                        player.position)
                      : 'Sin posición'}
                  </Badge>
                  {player.competitionLevel ? (
                    <Badge variant="outline">{player.competitionLevel}</Badge>
                  ) : null}
                  {player.clubName ? <Badge variant="outline">{player.clubName}</Badge> : null}
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


