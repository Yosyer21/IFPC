import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPETITION_LEVEL_LABELS, POSITION_LABELS, ROLE_LABELS } from '@ifpc/config';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PostCard } from '@/components/discovery/post-card';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { ProfileHeader } from '@/components/player/profile-header';
import { ProfileStatsCard } from '@/components/player/profile-stats';
import { getFollowStats, listPostsByAuthor } from '@/lib/discovery';
import { getPlayerStats } from '@/lib/player-stats';
import { nameParts } from '@/lib/names';

const BASE = '/discovery';

/** Datos de jugador que personalizan el muro público. */
const PLAYER_PROFILE_SELECT = {
  id: true,
  headline: true,
  location: true,
  openTo: true,
  accentColor: true,
  bannerUrl: true,
  position: true,
  competitionLevel: true,
} as const;

function labelOf(labels: Record<string, string>, value: string | null | undefined): string | null {
  if (!value) return null;
  return labels[value] ?? value;
}

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

  const [posts, followStats, playerProfile] = await Promise.all([
    listPostsByAuthor(author.id),
    getFollowStats(author.id),
    author.role === 'PLAYER'
      ? prisma.player.findUnique({ where: { userId: author.id }, select: PLAYER_PROFILE_SELECT })
      : Promise.resolve(null),
  ]);
  const stats = playerProfile ? await getPlayerStats(playerProfile.id) : null;
  const { firstName, lastName } = nameParts(author.name);
  const subtitle =
    [
      labelOf(POSITION_LABELS as Record<string, string>, playerProfile?.position),
      labelOf(COMPETITION_LEVEL_LABELS as Record<string, string>, playerProfile?.competitionLevel),
    ]
      .filter(Boolean)
      .join(' · ') || null;

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-24">
        <Link href={BASE} className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a Discovery
        </Link>

        <div className="mt-4 mb-4">
          <ProfileHeader
            firstName={firstName}
            lastName={lastName}
            imageUrl={author.image}
            bannerUrl={playerProfile?.bannerUrl}
            accentColor={playerProfile?.accentColor}
            headline={playerProfile?.headline}
            location={playerProfile?.location}
            subtitle={subtitle}
            openTo={playerProfile?.openTo ?? []}
            badges={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{ROLE_LABELS[author.role] ?? author.role}</Badge>
                <span className="text-xs text-muted-foreground">
                  {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'} ·{' '}
                  {followStats.followers} {followStats.followers === 1 ? 'seguidor' : 'seguidores'}{' '}
                  · {followStats.following} siguiendo
                </span>
              </div>
            }
            actions={
              <Link
                href="/login"
                className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                Entrar para seguir
              </Link>
            }
          />
        </div>

        {stats ? <ProfileStatsCard stats={stats} className="mb-4" /> : null}

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
