import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS, COMPETITION_LEVEL_LABELS, FOOT_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'My profile de scouting' };

export default async function PlayerScoutingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { videos: true } } },
  });
  if (!player) notFound();

  const videoCount = player._count.videos;

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
    ['Position', positionLabel],
    ['Edad', player.dateOfBirth ? `${Math.floor((Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old` : '—'],
    ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Preferred foot', footLabel],
    ['Nacionalidad', player.nationality ?? '—'],
    ['Nivel competitivo', competitionLabel],
    ['Club actual', player.clubName ?? '—'],
    ['Available videos', String(videoCount)],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Profile de scouting"
        subtitle="This is how scouts and clubs see you. Keep your data and videos updated to appear in searches."
        icon="search"
      />

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

      <div className="mt-4 flex flex-col gap-2">
        <Link href="/dashboard/player/profile/edit" className="text-sm text-primary hover:underline">
          → Complete profile
        </Link>
        <Link href="/dashboard/player/videos/upload" className="text-sm text-primary hover:underline">
          → Upload videos
        </Link>
      </div>
    </div>
  );
}
