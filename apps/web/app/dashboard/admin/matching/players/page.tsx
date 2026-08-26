import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { matchScore } from '@ifpc/matching';
import { IconWhistle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Matching · Jugadores' };

export default async function AdminMatchingPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [players, requirements] = await Promise.all([
    prisma.player.findMany({ include: { user: true }, take: 200 }),
    prisma.requirement.findMany({
      where: { status: 'OPEN' },
      include: { club: true },
      take: 200,
    }),
  ]);

  const rows = players.map((player) => {
    let best: { score: number; requirement: (typeof requirements)[number] } | null = null;
    for (const requirement of requirements) {
      const score = matchScore(player, requirement).total;
      if (!best || score > best.score) best = { score, requirement };
    }
    return { player, best };
  });
  rows.sort((a, b) => (b.best?.score ?? 0) - (a.best?.score ?? 0));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Matching · Jugadores" subtitle="Mejor coincidencia de cada jugador" icon="whistle">
        <Link href="/dashboard/admin/matching" className="text-sm text-muted-foreground hover:underline">
          ← Matching
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registered players.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map(({ player, best }) => (
                <div
                  key={player.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <IconWhistle className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {player.firstName} {player.lastName}
                      </span>
                      <Badge variant="outline">{player.position ?? 'No position'}</Badge>
                      <Badge variant="outline">{player.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {best
                        ? `Mejor match: ${best.requirement.club?.name ?? 'Club'} · ${best.requirement.title}`
                        : 'Sin requisitos abiertos que evaluar'}
                    </div>
                  </div>
                  {best ? (
                    <Badge variant={best.score >= 80 ? 'success' : best.score >= 60 ? 'warning' : 'default'}>
                      {best.score}%
                    </Badge>
                  ) : (
                    <Badge>—</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


