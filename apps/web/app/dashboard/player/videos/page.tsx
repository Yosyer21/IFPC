import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Mis vídeos' };

export default async function PlayerVideosPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { videos: { orderBy: { createdAt: 'desc' } } },
  });
  if (!player) notFound();

  const videos = player.videos;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Mis vídeos" icon="video">
        <Link
          href="/dashboard/player/videos/upload"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
        >
          Subir vídeo
        </Link>
      </PageHeader>

      {videos.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no has subido vídeos. Sube tus highlights para que ojeadores y clubes puedan verte
              jugar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Link key={video.id} href={`/dashboard/player/videos/${video.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary">
                <CardContent>
                  <video
                    src={video.url}
                    className="mb-3 aspect-video w-full rounded-md bg-black"
                    preload="metadata"
                    controls
                  />
                  <h2 className="font-semibold">{video.title}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={video.status === 'ready' ? 'success' : 'warning'}>
                      {video.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {video.createdAt.toLocaleDateString('es')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
