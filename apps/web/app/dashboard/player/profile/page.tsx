import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  COMPETITION_LEVEL_LABELS,
  FOOT_LABELS,
  PLAYER_STATUS_LABELS,
  POSITION_LABELS,
  ROLE_LABELS,
  profileAccentColors,
} from '@ifpc/config';
import { ProfileChecklistCard } from '@/components/profile/profile-checklist-card';
import { ProfileGrid } from '@/components/profile/profile-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileStatsCard } from '@/components/player/profile-stats';
import { CoverPhotoEditor } from '@/components/player/cover-photo-editor';
import { ProfilePhotoEditor } from '@/components/player/profile-photo-editor';
import { StatusToggle } from '@/components/player/status-toggle';
import { PostCard } from '@/components/discovery/post-card';
import { playerProfileChecklist } from '@/lib/player';
import { getPlayerStats } from '@/lib/player-stats';
import { getProfileViewStats } from '@/lib/profile-views';
import { listPostsByAuthor } from '@/lib/discovery';
import {
  IconTarget,
  IconTrendingUp,
  IconTrophy,
  IconUsers,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'My profile' };

export default async function PlayerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      // Contador que completa la checklist (temporadas de trayectoria).
      _count: { select: { career: true } },
    },
  });
  if (!player) notFound();

  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';
  const statusLabel =
    (PLAYER_STATUS_LABELS as Record<string, string | undefined>)[player.status] ?? player.status;
  const footLabel = player.foot
    ? ((FOOT_LABELS as Record<string, string | undefined>)[player.foot] ?? player.foot)
    : '—';
  const competitionLabel = player.competitionLevel
    ? ((COMPETITION_LEVEL_LABELS as Record<string, string | undefined>)[player.competitionLevel] ??
      player.competitionLevel)
    : '—';

  const accent = profileAccentColors(player.accentColor);
  const checklist = playerProfileChecklist({
    ...player,
    image: player.user.image,
    careerCount: player._count.career,
  });
  const viewStats = await getProfileViewStats(player.id);
  const stats = await getPlayerStats(player.id);
  // Lo que ya has publicado en Discovery: aparece en tu perfil como un muro.
  const myPosts = await listPostsByAuthor(session.user.id, 5, session.user.id);

  const rows: [string, string][] = [
    ['Name', `${player.firstName} ${player.lastName}`],
    ['Email', player.user.email],
    ['Date of birth', player.dateOfBirth ? player.dateOfBirth.toLocaleDateString('en-GB') : '—'],
    ['Nationality', player.nationality ?? '—'],
    ['Position', positionLabel],
    ['Preferred foot', footLabel],
    ['Competition level', competitionLabel],
    ['Height', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Weight', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Current club', player.clubName ?? '—'],
  ];

  const subLinks = [
    { href: '/dashboard/player/profile/football', label: 'Football profile', icon: IconTarget },
    { href: '/dashboard/player/profile/physical', label: 'Physical data', icon: IconTrendingUp },
    { href: '/dashboard/player/profile/technical', label: 'Technical level', icon: IconWhistle },
    { href: '/dashboard/player/career', label: 'Career history', icon: IconTrophy },
    {
      href: `/dashboard/discovery/u/${session.user.id}`,
      label: 'My wall on Discovery',
      icon: IconUsers,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl" style={{ '--profile-accent': accent.hex } as CSSProperties}>
      {/* Cabecera personalizable: portada, acento, headline, ubicación y chips. */}
      <div className="mb-6">
        <ProfileHeader
          firstName={player.firstName}
          lastName={player.lastName}
          imageUrl={player.user.image}
          bannerUrl={player.bannerUrl}
          accentColor={player.accentColor}
          headline={player.headline}
          location={player.location}
          subtitle={`${positionLabel}${competitionLabel !== '—' ? ` · ${competitionLabel}` : ''}`}
          openTo={player.openTo}
          badges={
            <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
              {statusLabel}
            </Badge>
          }
          actions={
            <>
              <StatusToggle status={player.status} />
              <Link
                href="/dashboard/player/profile/edit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
              >
                Edit profile
              </Link>
            </>
          }
          coverEditor={
            <CoverPhotoEditor
              hasBanner={Boolean(player.bannerUrl)}
              redirectTo="/dashboard/player/profile"
            />
          }
          photoEditor={
            <ProfilePhotoEditor
              hasImage={Boolean(player.user.image)}
              redirectTo="/dashboard/player/profile"
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ProfileStatsCard stats={stats} />

          <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <CardContent>
              <ProfileGrid rows={rows} />
            </CardContent>
          </Card>

          {player.bio ? (
            <Card className="animate-fade-up" style={{ animationDelay: '200ms' }}>
              <CardContent>
                <h2 className="mb-2 font-semibold">Biography</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{player.bio}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="animate-fade-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="flex flex-col gap-3">
              <h2 className="font-semibold">Interest in your profile</h2>
              {viewStats.viewers === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nobody has viewed your profile yet. Share it and keep your details and videos up to
                  date so clubs and scouts can find you.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-5">
                    <div>
                      <div className="text-2xl font-bold tabular-nums">{viewStats.viewers}</div>
                      <div className="text-xs text-muted-foreground">Interested</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums">{viewStats.views}</div>
                      <div className="text-xs text-muted-foreground">Visits</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums">{viewStats.newThisWeek}</div>
                      <div className="text-xs text-muted-foreground">New (7 days)</div>
                    </div>
                  </div>
                  <div className="flex flex-col divide-y divide-border/60">
                    {viewStats.byRole.map((entry) => (
                      <div
                        key={entry.role}
                        className="flex items-center justify-between py-1.5 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {ROLE_LABELS[entry.role] ?? entry.role}
                        </span>
                        <span className="font-medium tabular-nums">{entry.viewers}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <ProfileChecklistCard state={checklist} />

          <Card className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <CardContent className="flex flex-col gap-1">
              <h2 className="mb-2 font-semibold">My profile card</h2>
              {subLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {link.label}
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Muro: tus posts de Discovery, como en un perfil social. */}
      <section className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">My posts</h2>
          <Link href="/dashboard/discovery" className="text-sm text-primary hover:underline">
            Post on Discovery →
          </Link>
        </div>
        {myPosts.length === 0 ? (
          <Card className="animate-fade-up">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have not posted anything yet. Share a video, a photo or a milestone on Discovery
                and it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          myPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={session.user.id}
              viewerRole={session.user.role}
            />
          ))
        )}
      </section>
    </div>
  );
}
