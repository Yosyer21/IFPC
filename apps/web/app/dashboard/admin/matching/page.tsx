import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { matchScore } from '@ifpc/matching';
import { IconBriefcase, IconTarget, IconUsers, IconWhistle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Matching' };

export default async function AdminMatchingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [players, requirements, openOpportunities] = await Promise.all([
    prisma.player.findMany({ include: { user: true }, take: 200 }),
    prisma.requirement.findMany({
      where: { status: 'OPEN' },
      include: { club: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.opportunity.count({ where: { status: 'OPEN' } }),
  ]);

  const matches: { player: (typeof players)[number]; requirement: (typeof requirements)[number]; score: number }[] = [];
  for (const player of players) {
    for (const requirement of requirements) {
      matches.push({
        player,
        requirement,
        score: matchScore(player, requirement).total,
      });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  const top = matches.slice(0, 8);
  const avg =
    matches.length > 0
      ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length)
      : 0;

  const scoreBuckets = [0, 20, 40, 60, 80].map((start) => ({
    label: `${start}–${start + 19}`,
    value: matches.filter((m) => m.score >= start && m.score < start + 20).length,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Matching"
        subtitle="Motor de coincidencia entre jugadores y requisitos de clubes"
        icon="target"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard href="/dashboard/admin/matching/players" icon={IconWhistle} label="Jugadores" value={players.length} />
        <StatCard href="/dashboard/admin/matching/clubs" icon={IconBriefcase} label="Requisitos abiertos" value={requirements.length} />
        <StatCard href="/dashboard/admin/matching" icon={IconTarget} label="Score medio" value={avg} suffix="%" />
        <StatCard href="/dashboard/admin/opportunities" icon={IconUsers} label="Oportunidades abiertas" value={openOpportunities} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Score distribution</h2>
            <CountsBars items={scoreBuckets} />
            <p className="mt-3 text-xs text-muted-foreground">
              {matches.length} combinaciones jugador × requisito evaluadas por el motor.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Quick access</h2>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/admin/matching/players" className="rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted">
                Ver scores por jugador →
              </Link>
              <Link href="/dashboard/admin/matching/clubs" className="rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted">
                Ver requisitos por club →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Best matches</h2>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay suficientes jugadores o requisitos para calcular coincidencias.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {top.map((match, index) => (
                <div key={`${match.player.id}-${match.requirement.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span className="text-muted-foreground">#{index + 1}</span>
                      <span>{match.player.firstName} {match.player.lastName}</span>
                      <Badge variant="outline">{match.player.position ?? 'No position'}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {match.requirement.club?.name} · {match.requirement.title}
                    </div>
                  </div>
                  <Badge variant={match.score >= 80 ? 'success' : match.score >= 60 ? 'warning' : 'default'}>
                    {match.score}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


