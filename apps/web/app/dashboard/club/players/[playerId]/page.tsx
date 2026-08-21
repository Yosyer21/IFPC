import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { POSITION_LABELS } from '@future-buller/config';

export const metadata: Metadata = { title: 'Jugador' };

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
    include: { user: true, videos: { orderBy: { createdAt: 'desc' } }, evaluations: true },
  });
  if (!player) notFound();

  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

  const rows: [string, string][] = [
    ['Posición', positionLabel],
    ['Nacionalidad', player.nationality ?? '—'],
    ['Pierna hábil', player.foot ?? '—'],
    ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Club actual', player.clubName ?? '—'],
    ['Email de contacto', player.user.email],
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
        ← Jugadores
      </Link>
      <h1 className="mb-4 text-2xl font-bold">
        {player.firstName} {player.lastName}
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="success">{player.status}</Badge>
        {average ? <Badge variant="default">Media: {average}/10</Badge> : null}
      </div>

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
            <h2 className="mb-2 font-semibold">Biografía</h2>
            <p className="text-sm text-muted-foreground">{player.bio}</p>
          </CardContent>
        </Card>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold">Vídeos</h2>
      {player.videos.length === 0 ? (
        <p className="text-sm text-muted-foreground">El jugador aún no ha subido vídeos.</p>
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
