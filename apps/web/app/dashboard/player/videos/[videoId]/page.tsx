import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Vídeo' };

export default async function PlayerVideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const video = await prisma.video.findFirst({
    where: { id: videoId, player: { userId: session.user.id } },
  });
  if (!video) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/videos"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Mis vídeos
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{video.title}</h1>
      <video src={video.url} controls className="aspect-video w-full rounded-lg border border-border bg-black" />
      <Card className="mt-4">
        <CardContent className="flex items-center gap-3">
          <Badge variant={video.status === 'ready' ? 'success' : 'warning'}>{video.status}</Badge>
          {video.duration ? (
            <span className="text-sm text-muted-foreground">
              Duración: {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Subido el {video.createdAt.toLocaleDateString('es')}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
