import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ROLE_LABELS } from '@ifpc/config';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PostCard } from '@/components/discovery/post-card';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { PlayerAvatar } from '@/components/player/avatar';
import { getFollowStats, listPostsByAuthor } from '@/lib/discovery';
import { nameParts } from '@/lib/names';

const BASE = '/discovery';

/** SEO: nombre y rol del perfil. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true },
  });
  if (!author) {
    return { title: 'Perfil no encontrado — Future Baller' };
  }

  const description = `Publicaciones de ${author.name} (${
    ROLE_LABELS[author.role] ?? author.role
  }) en Discovery, el feed de la comunidad Future Baller.`;

  return {
    title: `${author.name} — Future Baller`,
    description,
    alternates: { canonical: `${BASE}/u/${userId}` },
    openGraph: { title: author.name, description, type: 'profile' },
  };
}

/** Muro público de un autor: sus publicaciones, sin acciones sociales. */
export default async function PublicAuthorPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, image: true },
  });
  if (!author) notFound();

  const [posts, followStats] = await Promise.all([
    listPostsByAuthor(author.id),
    getFollowStats(author.id),
  ]);
  const { firstName, lastName } = nameParts(author.name);

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-24">
        <Link href={BASE} className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a Discovery
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
                  {followStats.followers}{' '}
                  {followStats.followers === 1 ? 'seguidor' : 'seguidores'} ·{' '}
                  {followStats.following} siguiendo
                </span>
              </div>
            </div>
            <Link
              href="/login"
              className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              Entrar para seguir
            </Link>
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
              <PostCard key={post.id} post={post} viewerId="" viewerRole="" readOnly />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
