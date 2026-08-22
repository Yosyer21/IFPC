import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Vídeos del jugador' };

export default async function AgentPlayerVideosPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();
  const representation = await prisma.agentPlayer.findUnique({
    where: { agentId_playerId: { agentId: agent.id, playerId } },
  });
  if (!representation) notFound();

  const videos = await prisma.video.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/dashboard/agent/players/${playerId}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Jugador
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Vídeos</h1>

      {videos.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">El jugador no ha subido vídeos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map((video) => (
            <Card key={video.id}>
              <CardContent>
                <video
                  src={video.url}
                  controls
                  preload="metadata"
                  className="mb-2 aspect-video w-full rounded-md bg-black"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{video.title}</p>
                  <Badge variant={video.status === 'ready' ? 'success' : 'warning'}>
                    {video.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
