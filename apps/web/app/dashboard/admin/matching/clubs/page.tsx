import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { matchScore } from '@ifpc/matching';
import { IconBriefcase } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Matching · Clubs' };

export default async function AdminMatchingClubsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [players, requirements] = await Promise.all([
    prisma.player.findMany({ include: { user: true }, take: 200 }),
    prisma.requirement.findMany({
      where: { status: 'OPEN' },
      include: { club: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  const rows = requirements.map((requirement) => {
    let best: { score: number; player: (typeof players)[number] } | null = null;
    for (const player of players) {
      const score = matchScore(player, requirement).total;
      if (!best || score > best.score) best = { score, player };
    }
    return { requirement, best };
  });
  rows.sort((a, b) => (b.best?.score ?? 0) - (a.best?.score ?? 0));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Matching · Clubs" subtitle="Mejor jugador para cada requisito abierto" icon="briefcase">
        <Link href="/dashboard/admin/matching" className="text-sm text-muted-foreground hover:underline">
          ← Matching
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay requisitos abiertos.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map(({ requirement, best }) => (
                <div
                  key={requirement.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{requirement.club?.name ?? 'Club'}</span>
                      <Badge variant="outline">{requirement.title}</Badge>
                      {requirement.position ? <Badge variant="outline">{requirement.position}</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {requirement.ageMin || requirement.ageMax
                        ? `Edad ${requirement.ageMin ?? '?'}–${requirement.ageMax ?? '?'} · `
                        : ''}
                      {best
                        ? `Mejor candidato: ${best.player.firstName} ${best.player.lastName}`
                        : 'Sin jugadores que evaluar'}
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


