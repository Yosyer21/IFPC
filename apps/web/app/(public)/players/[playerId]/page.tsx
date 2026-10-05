import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { PlayerAvatar } from '@/components/player/avatar';
import { trackProfileView } from '@/lib/profile-views';

function positionLabelOf(position: string | null): string {
  return position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[position] ?? position)
    : '—';
}

/** Only available/active players expose a public profile. */
function isPublicProfile(status: string): boolean {
  return status === 'AVAILABLE' || status === 'ACTIVE';
}

/** Cached so `generateMetadata` and the page share a single query per request. */
const getPlayer = cache((playerId: string) =>
  prisma.player.findUnique({
    where: { id: playerId },
    include: {
      user: true,
      // Only the score column is needed for the overall rating.
      evaluations: { select: { score: true } },
      career: { orderBy: [{ isCurrent: 'desc' }, { season: 'desc' }] },
      _count: { select: { videos: true } },
    },
  })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playerId: string }>;
}): Promise<Metadata> {
  const { playerId } = await params;
  const player = await getPlayer(playerId);
  if (!player || !isPublicProfile(player.status)) {
    // The root layout appends "| Future Baller".
    return { title: 'Jugador no encontrado' };
  }

  const name = `${player.firstName} ${player.lastName}`;
  const position = positionLabelOf(player.position);
  const description =
    player.bio?.slice(0, 155) ??
    `Perfil deportivo de ${name} (${position}${
      player.nationality ? `, ${player.nationality}` : ''
    }) en Future Baller.`;

  return {
    title: `${name} · ${position}`,
    description,
    openGraph: { title: name, description, type: 'profile' },
  };
}

export default async function PublicPlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;

  const player = await getPlayer(playerId);
  if (!player || !isPublicProfile(player.status)) notFound();

  // Interés de terceros: visita registrada para las métricas del jugador.
  await trackProfileView({ playerId: player.id, ownerUserId: player.userId });

  const positionLabel = positionLabelOf(player.position);

  const overall =
    player.evaluations.length > 0
      ? Math.round(
          (player.evaluations.reduce((s, e) => s + e.score, 0) / player.evaluations.length) * 10
        ) / 10
      : null;

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <Link href="/players" className="text-sm text-muted-foreground hover:text-emerald-400">
          ← Players
        </Link>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8">
          <div className="flex flex-wrap items-center gap-4">
            <PlayerAvatar
              firstName={player.firstName}
              lastName={player.lastName}
              imageUrl={player.user.image}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {player.firstName} {player.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {positionLabel}
                {age !== null ? ` · ${age} years old` : ''} · {player.nationality ?? 'Sin nacionalidad'}
              </p>
            </div>
            {overall !== null ? (
              <div className="ml-auto rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{overall}</div>
                <div className="text-[10px] uppercase tracking-wide text-emerald-400/70">
                  Nivel global
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {player.competitionLevel ? (
              <Badge variant="outline">{player.competitionLevel}</Badge>
            ) : null}
            {player.clubName ? <Badge variant="outline">{player.clubName}</Badge> : null}
            {player.foot ? <Badge variant="outline">Pierna: {player.foot}</Badge> : null}
            <Badge variant="outline">{player._count.videos} videos</Badge>
            <Badge variant="outline">{player.evaluations.length} evaluaciones</Badge>
          </div>

          {player.bio ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{player.bio}</p>
          ) : null}

          {player.career.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Trayectoria
              </h2>
              <div className="mt-2 flex flex-col divide-y divide-border/60">
                {player.career.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {entry.clubName}
                        {entry.isCurrent ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-400">
                            actual
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.season}
                        {entry.category ? ` · ${entry.category}` : ''}
                      </div>
                    </div>
                    <div className="text-xs tabular-nums text-muted-foreground">
                      {entry.appearances} PJ · {entry.goals} G · {entry.assists} A
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 rounded-xl border border-border/60 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Do you represent a club or university? Contact this player through the platform.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Crear cuenta y contactar
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


