import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { affinityScore } from '@ifpc/matching';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { AffinityBadge, MatchBreakdown } from '@/components/player/match-score';
import { buildAffinityTarget } from '@/lib/affinity';
import { trackProfileView } from '@/lib/profile-views';
import { canShowStatsAndClips, isVisibleToClubs } from '@/lib/minor';
import { FILM_CLIP_CATEGORY_LABELS } from '@/lib/film-room';

export const metadata: Metadata = { title: 'Player' };

export default async function ClubPlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      user: true,
      videos: { orderBy: { createdAt: 'desc' } },
      evaluations: true,
      parents: { select: { idVisibleToClubs: true, showStatsAndClips: true } },
      filmClips: {
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { post: { select: { id: true } } },
      },
      _count: { select: { filmClips: true } },
    },
  });
  if (!player) notFound();
  if (!isVisibleToClubs(player.dateOfBirth, player.parents)) notFound();
  const showClips = canShowStatsAndClips(player.dateOfBirth, player.parents);

  const [club, career] = await Promise.all([
    prisma.club.findUnique({
      where: { userId: session.user.id },
      include: { requirements: { where: { status: 'OPEN' } } },
    }),
    prisma.careerEntry.aggregate({
      where: { playerId: player.id },
      _sum: { appearances: true, goals: true, assists: true },
    }),
  ]);

  const affinity = affinityScore(
    {
      position: player.position,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      location: player.location,
      clubName: player.clubName,
      competitionLevel: player.competitionLevel,
      // Privacidad: stats/clips ocultos por el padre de un menor no se usan.
      appearances: showClips ? (career._sum.appearances ?? 0) : null,
      goalContributions: showClips
        ? (career._sum.goals ?? 0) + (career._sum.assists ?? 0)
        : null,
      highlights: showClips ? player.videos.length + player._count.filmClips : null,
    },
    buildAffinityTarget(
      {
        kind: 'club',
        name: club?.name ?? 'Your club',
        country: club?.country ?? null,
        city: club?.city ?? null,
      },
      club?.requirements ?? []
    )
  );

  // Interés de terceros: view registrada para las métricas del player.
  await trackProfileView({ playerId: player.id, ownerUserId: player.userId });

  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

  const rows: [string, string][] = [
    ['Position', positionLabel],
    ['Nationality', player.nationality ?? '—'],
    ['Preferred foot', player.foot ?? '—'],
    ['Height', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Weight', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Current club', player.clubName ?? '—'],
    ['Contact email', player.user.email],
  ];

  const average =
    player.evaluations.length > 0
      ? (
          player.evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) /
          player.evaluations.length
        ).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/club/players"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Players
      </Link>
      <h1 className="mb-4 text-2xl font-bold">
        {player.firstName} {player.lastName}
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="success">{player.status}</Badge>
        {average ? <Badge variant="default">Media: {average}/10</Badge> : null}
        <AffinityBadge score={affinity.total} />
      </div>

      <Card className="mb-4">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Affinity with {club?.name ?? 'your club'}</h2>
              <p className="text-sm text-muted-foreground">{affinity.summary}</p>
            </div>
          </div>
          <div className="mt-4">
            <MatchBreakdown result={affinity} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
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

      {player.bio ? (
        <Card className="mb-4">
          <CardContent>
            <h2 className="mb-2 font-semibold">Biography</h2>
            <p className="text-sm text-muted-foreground">{player.bio}</p>
          </CardContent>
        </Card>
      ) : null}

      {showClips && player.filmClips.length > 0 ? (
        <>
          <h2 className="mb-3 text-lg font-semibold">Film Room highlights</h2>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {player.filmClips.map((clip) => (
              <Card key={clip.id}>
                <CardContent>
                  <video
                    src={clip.videoUrl}
                    controls
                    preload="metadata"
                    className="mb-2 aspect-video w-full rounded-md bg-black"
                  />
                  <p className="text-sm font-medium">{clip.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {FILM_CLIP_CATEGORY_LABELS[clip.category]}
                  </p>
                  <Link
                    href={`/dashboard/discovery/${clip.post.id}`}
                    className="text-xs text-[#4f6b0a] hover:underline"
                  >
                    View on Discovery →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold">Videos</h2>
      {!showClips ? (
        <p className="text-sm text-muted-foreground">
          Videos and clips are private for this player.
        </p>
      ) : player.videos.length === 0 ? (
        <p className="text-sm text-muted-foreground">The player has not uploaded videos yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {player.videos.map((video) => (
            <Card key={video.id}>
              <CardContent>
                <video
                  src={video.url}
                  controls
                  preload="metadata"
                  className="mb-2 aspect-video w-full rounded-md bg-black"
                />
                <p className="text-sm font-medium">{video.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
