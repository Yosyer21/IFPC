import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { COMPETITION_LEVEL_LABELS, POSITION_LABELS, ROLE_LABELS } from '@ifpc/config';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PostCard } from '@/components/discovery/post-card';
import { FollowButton } from '@/components/discovery/follow-button';
import { ActionSubmit } from '@/components/discovery/action-submit';
import {
  setAuthorPreferenceAction,
  toggleBlockAction,
  toggleMuteAction,
} from '@/app/actions/discovery';
import { CoverPhotoEditor } from '@/components/player/cover-photo-editor';
import { ProfileHeader } from '@/components/player/profile-header';
import { ProfilePhotoEditor } from '@/components/player/profile-photo-editor';
import { ProfileStatsCard } from '@/components/player/profile-stats';
import { getFollowStats, listPostsByAuthor } from '@/lib/discovery';
import { getAuthorPreference } from '@/lib/discovery-preferences';
import { getPrivacyState, hasBlockBetween } from '@/lib/discovery-privacy';
import { getPlayerStats } from '@/lib/player-stats';
import { nameParts } from '@/lib/names';

export const metadata: Metadata = { title: 'Perfil' };

/** Datos de jugador que personalizan el muro (portada, acento, titular y chips). */
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

/**
 * Perfil de un autor como en una red social: panel frontal con portada y foto
 * (editables si es tu perfil), estadísticas del jugador cuando lo es y su muro
 * de publicaciones de Discovery.
 */
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

  const isSelf = author.id === session.user.id;
  const [posts, followStats, privacy, blockBetween, preference, playerProfile] = await Promise.all([
    listPostsByAuthor(author.id, undefined, session.user.id),
    getFollowStats(author.id, session.user.id),
    getPrivacyState(author.id, session.user.id),
    hasBlockBetween(session.user.id, author.id),
    getAuthorPreference({ userId: session.user.id, authorId: author.id }),
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
  const muroPath = `/dashboard/discovery/u/${author.id}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/discovery"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver al feed
      </Link>

      {blockBetween && !privacy.blocked && !isSelf ? (
        <Card className="mt-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Este perfil no está disponible.</p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                    {followStats.followers}{' '}
                    {followStats.followers === 1 ? 'seguidor' : 'seguidores'} ·{' '}
                    {isSelf ? (
                      <Link href="/dashboard/discovery/following" className="hover:underline">
                        {followStats.following} siguiendo
                      </Link>
                    ) : (
                      <>{followStats.following} siguiendo</>
                    )}
                  </span>
                </div>
              }
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {isSelf ? (
                    <Link
                      href="/dashboard/player/profile/edit"
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
                    >
                      Editar mi perfil
                    </Link>
                  ) : (
                    <>
                      {privacy.blocked ? null : (
                        <FollowButton userId={author.id} isFollowing={followStats.isFollowing} />
                      )}
                      {privacy.blocked ? null : (
                        <>
                          <form action={setAuthorPreferenceAction}>
                            <input type="hidden" name="userId" value={author.id} />
                            <input
                              type="hidden"
                              name="kind"
                              value={preference === 'MORE' ? '' : 'MORE'}
                            />
                            <ActionSubmit
                              label={preference === 'MORE' ? '✓ Ver más' : 'Ver más'}
                              title={
                                preference === 'MORE'
                                  ? 'Quitar «ver más» de este perfil'
                                  : 'Priorizar sus publicaciones en Para ti y Tendencias'
                              }
                            />
                          </form>
                          <form action={setAuthorPreferenceAction}>
                            <input type="hidden" name="userId" value={author.id} />
                            <input
                              type="hidden"
                              name="kind"
                              value={preference === 'LESS' ? '' : 'LESS'}
                            />
                            <ActionSubmit
                              label={preference === 'LESS' ? '✓ Ver menos' : 'Ver menos'}
                              title={
                                preference === 'LESS'
                                  ? 'Quitar «ver menos» de este perfil'
                                  : 'Sacar sus publicaciones de Para ti y Tendencias'
                              }
                            />
                          </form>
                        </>
                      )}
                      <form action={toggleMuteAction}>
                        <input type="hidden" name="userId" value={author.id} />
                        <ActionSubmit label={privacy.muted ? 'Dejar de silenciar' : 'Silenciar'} />
                      </form>
                      <form action={toggleBlockAction}>
                        <input type="hidden" name="userId" value={author.id} />
                        <ActionSubmit
                          label={privacy.blocked ? 'Desbloquear' : 'Bloquear'}
                          variant={privacy.blocked ? 'outline' : 'danger'}
                          confirmText={
                            privacy.blocked
                              ? undefined
                              : '¿Bloquear a este perfil? Dejaréis de veros y se cancelan los seguimientos.'
                          }
                        />
                      </form>
                    </>
                  )}
                </div>
              }
              coverEditor={
                isSelf && playerProfile ? (
                  <CoverPhotoEditor
                    hasBanner={Boolean(playerProfile.bannerUrl)}
                    redirectTo={muroPath}
                  />
                ) : null
              }
              photoEditor={
                isSelf ? (
                  <ProfilePhotoEditor hasImage={Boolean(author.image)} redirectTo={muroPath} />
                ) : null
              }
            />
          </div>

          {preference ? (
            <p className="mb-4 text-xs text-muted-foreground">
              {preference === 'MORE'
                ? 'Verás más de este perfil en «Para ti» y «Tendencias».'
                : 'Sus publicaciones salen de «Para ti» y «Tendencias»; siguen en «Recientes» y «Siguiendo».'}
            </p>
          ) : null}

          {stats ? <ProfileStatsCard stats={stats} className="mb-4" /> : null}

          {privacy.blocked ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Has bloqueado a este perfil: no ves su contenido y no puede interactuar contigo.
                </p>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
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
        </>
      )}
    </div>
  );
}
