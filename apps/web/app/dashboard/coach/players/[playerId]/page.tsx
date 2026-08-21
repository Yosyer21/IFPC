import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { POSITION_LABELS } from '@future-buller/config';
import { PlayerAvatar } from '@/components/player/avatar';
import { DonutChart, RadarChart } from '@/components/player/charts';

export const metadata: Metadata = { title: 'Jugador' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  physical: 'Físico',
  tactical: 'Táctica',
  psychological: 'Psicológica',
};

export default async function CoachPlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) notFound();

  const assignment = await prisma.coachPlayer.findUnique({
    where: { coachId_playerId: { coachId: coach.id, playerId } },
  });
  if (!assignment) notFound();

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      evaluations: { orderBy: { createdAt: 'desc' } },
      _count: { select: { goals: true, videos: true } },
    },
  });
  if (!player) notFound();

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

  // Nivel del jugador por categoría
  const byCategory = new Map<string, number[]>();
  for (const evaluation of player.evaluations) {
    const list = byCategory.get(evaluation.category) ?? [];
    list.push(evaluation.score);
    byCategory.set(evaluation.category, list);
  }
  const radarCategories: string[] = [];
  const radarValues: number[] = [];
  for (const [category, scores] of byCategory) {
    radarCategories.push(CATEGORY_LABELS[category] ?? category);
    radarValues.push(Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10);
  }

  // Media del jugador
  const overall =
    player.evaluations.length > 0
      ? Math.round(
          (player.evaluations.reduce((s, e) => s + e.score, 0) / player.evaluations.length) * 10
        ) / 10
      : null;

  const rows: [string, string][] = [
    ['Posición', positionLabel],
    ['Edad', age !== null ? `${age} años` : '—'],
    ['Nacionalidad', player.nationality ?? '—'],
    ['Club actual', player.clubName ?? '—'],
    ['Estado', player.status],
    ['Objetivos', String(player._count.goals)],
    ['Vídeos', String(player._count.videos)],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/coach/players"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Mis jugadores
      </Link>

      {/* Hero del jugador */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {player.firstName} {player.lastName}
              </h1>
              <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                {player.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {positionLabel}
              {age !== null ? ` · ${age} años` : ''}
              {player.clubName ? ` · ${player.clubName}` : ''}
              {overall !== null ? ` · Media ${overall}/10` : ''}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/dashboard/coach/players/${player.id}/development`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Ver objetivos y crear
            </Link>
            <Link
              href={`/dashboard/coach/players/${player.id}/evaluations`}
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              Ver evaluaciones y registrar
            </Link>
          </div>
        </div>
      </section>

      {/* Radar + media */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '120ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Nivel del jugador</h2>
            {radarValues.length >= 3 ? (
              <div className="animate-scale-in mx-auto max-w-sm">
                <RadarChart categories={radarCategories} values={radarValues} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="max-w-xs text-sm text-muted-foreground">
                  Aún no hay suficientes evaluaciones de {player.firstName} para mostrar su nivel
                  por categoría.
                </p>
                <Link
                  href={`/dashboard/coach/players/${player.id}/evaluations`}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Registrar evaluación
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="animate-fade-up flex flex-col items-center" style={{ animationDelay: '200ms' }}>
            <CardContent className="flex w-full flex-col items-center gap-4">
              <h2 className="self-start font-semibold">Media del jugador</h2>
              {overall !== null ? (
                <DonutChart
                  value={overall * 10}
                  label={`${overall}`}
                  sublabel={`sobre 10 · ${player.evaluations.length} evaluaciones`}
                />
              ) : (
                <p className="py-8 text-sm text-muted-foreground">Sin evaluaciones aún.</p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '280ms' }}>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

