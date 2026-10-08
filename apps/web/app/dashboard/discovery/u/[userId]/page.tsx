import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { ROLE_LABELS } from '@ifpc/config';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PostCard } from '@/components/discovery/post-card';
import { FollowButton } from '@/components/discovery/follow-button';
import { PlayerAvatar } from '@/components/player/avatar';
import { getFollowStats, listPostsByAuthor } from '@/lib/discovery';
import { nameParts } from '@/lib/names';

export const metadata: Metadata = { title: 'Perfil' };

/** Muro de un autor: sus publicaciones en Discovery. */
export default async function DiscoveryAuthorPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, image: true },
  });
  if (!author) notFound();

  const [posts, followStats] = await Promise.all([
    listPostsByAuthor(author.id),
    getFollowStats(author.id, session.user.id),
  ]);
  const { firstName, lastName } = nameParts(author.name);
  const isSelf = author.id === session.user.id;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/discovery"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver al feed
      </Link>

      <Card className="mt-4 mb-4">
        <CardContent className="flex flex-wrap items-center gap-4">
          <PlayerAvatar
            firstName={firstName}
            lastName={lastName}
            imageUrl={author.image}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight">{author.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{ROLE_LABELS[author.role] ?? author.role}</Badge>
              <span className="text-xs text-muted-foreground">
                {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'} ·{' '}
                {followStats.followers} {followStats.followers === 1 ? 'seguidor' : 'seguidores'} ·{' '}
                {followStats.following} siguiendo
              </span>
            </div>
          </div>
          {isSelf ? null : (
            <FollowButton userId={author.id} isFollowing={followStats.isFollowing} />
          )}
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Todavía no ha publicado nada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={session.user.id}
              viewerRole={session.user.role}
            />
          ))}
        </div>
      )}
    </div>
  );
}
