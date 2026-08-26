import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS, COMPETITION_LEVEL_LABELS, FOOT_LABELS } from '@ifpc/config';

export const metadata: Metadata = { title: 'Football profile' };

export default async function PlayerFootballPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

  const footLabel = player.foot
    ? ((FOOT_LABELS as Record<string, string | undefined>)[player.foot] ?? player.foot)
    : '—';
  const competitionLabel = player.competitionLevel
    ? ((COMPETITION_LEVEL_LABELS as Record<string, string | undefined>)[player.competitionLevel] ??
      player.competitionLevel)
    : '—';

  const rows: [string, string][] = [
    ['Main position', positionLabel],
    ['Preferred foot', footLabel],
    ['Nivel competitivo', competitionLabel],
    ['Club actual', player.clubName ?? '—'],
    ['Disponibilidad', player.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Football profile</h1>
        <Link
          href="/dashboard/player/profile/edit"
          className="text-sm text-muted-foreground hover:underline"
        >
          Editar
        </Link>
      </div>
      <Card>
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
  );
}
