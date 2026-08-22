import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = { title: 'Perfil de jugador — IFPC' };

export default async function PublicPlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      evaluations: true,
      _count: { select: { videos: true } },
    },
  });
  if (!player || (player.status !== 'AVAILABLE' && player.status !== 'ACTIVE')) notFound();

  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

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
          ← Jugadores
        </Link>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl font-bold text-emerald-400">
              {player.firstName[0]}
              {player.lastName[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {player.firstName} {player.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {positionLabel}
                {age !== null ? ` · ${age} años` : ''} · {player.nationality ?? 'Sin nacionalidad'}
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
            <Badge variant="outline">{player._count.videos} vídeos</Badge>
            <Badge variant="outline">{player.evaluations.length} evaluaciones</Badge>
          </div>

          {player.bio ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{player.bio}</p>
          ) : null}

          <div className="mt-8 rounded-xl border border-border/60 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Representas a un club o universidad? Contacta con este jugador desde la plataforma.
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


