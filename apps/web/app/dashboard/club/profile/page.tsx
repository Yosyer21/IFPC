import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { clubProfileTagLabels, profileAccentColors } from '@ifpc/config';
import { ProfileChecklistCard } from '@/components/profile/profile-checklist-card';
import { ProfileGrid } from '@/components/profile/profile-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ClubCoverEditor } from '@/components/club/club-cover-editor';
import { ClubLogo } from '@/components/club/club-logo';
import { ClubLogoEditor } from '@/components/club/club-logo-editor';
import { ClubProfileStats } from '@/components/club/profile-stats';
import { PostCard } from '@/components/discovery/post-card';
import {
  IconBriefcase,
  IconFile,
  IconLive,
  IconMessageCircle,
  IconTarget,
  IconUsers,
} from '@/components/dashboard/icons';
import { clubLocation, clubProfileChecklist } from '@/lib/club';
import { listPostsByAuthor } from '@/lib/discovery';

export const metadata: Metadata = { title: 'Club profile' };

const PROFILE_REDIRECT = '/dashboard/club/profile';

export default async function ClubProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!club) notFound();

  // Todo lo que alimenta las cifras del perfil y la checklist.
  const [opportunities, applications, openRequirements, inquiries, staff, liveSessions, posts] =
    await Promise.all([
      prisma.opportunity.findMany({ where: { clubId: club.id }, select: { status: true } }),
      prisma.application.findMany({
        where: { opportunity: { clubId: club.id } },
        select: { status: true },
      }),
      prisma.requirement.count({ where: { clubId: club.id, status: 'OPEN' } }),
      prisma.inquiry.count({ where: { clubId: club.id } }),
      prisma.clubStaff.count({ where: { clubId: club.id } }),
      prisma.liveSession.count({ where: { clubId: club.id } }),
      prisma.post.count({ where: { authorId: session.user.id } }),
    ]);

  const openOpportunities = opportunities.filter((item) => item.status === 'OPEN').length;
  const pendingApplications = applications.filter((item) => item.status === 'PENDING').length;

  const accent = profileAccentColors(club.accentColor);
  const location = clubLocation(club);
  const subtitle = [club.league, club.foundedYear ? `Founded ${club.foundedYear}` : null]
    .filter(Boolean)
    .join(' · ');
  const checklist = clubProfileChecklist({
    ...club,
    opportunityCount: opportunities.length,
    staffCount: staff,
  });
  // Lo que el club ya ha publicado en Discovery: su muro, como en el perfil del jugador.
  const myPosts = await listPostsByAuthor(session.user.id, 5, session.user.id);

  const rows: [string, string][] = [
    ['Club name', club.name],
    ['Email', club.user?.email ?? '—'],
    ['Country', club.country],
    ['City', club.city ?? '—'],
    ['League', club.league ?? '—'],
    ['Founded', club.foundedYear ? String(club.foundedYear) : '—'],
    ['Member since', club.createdAt.toLocaleDateString('en-GB')],
    ['Verification', club.verified ? 'Verified club' : 'Pending verification'],
  ];

  const subLinks = [
    { href: '/dashboard/club/profile/edit', label: 'Edit club profile', icon: IconFile },
    { href: '/dashboard/club/staff', label: 'Staff and permissions', icon: IconUsers },
    { href: '/dashboard/club/opportunities', label: 'Opportunities', icon: IconTarget },
    { href: '/dashboard/club/live-sessions', label: 'Live sessions', icon: IconLive },
    {
      href: `/dashboard/discovery/u/${session.user.id}`,
      label: 'My wall on Discovery',
      icon: IconMessageCircle,
    },
    { href: `/clubs/${club.id}`, label: 'Public page', icon: IconBriefcase },
  ];

  return (
    <div className="mx-auto max-w-5xl" style={{ '--profile-accent': accent.hex } as CSSProperties}>
      {/* Cabecera personalizable: portada, acento, headline, ubicación y chips. */}
      <div className="mb-6">
        <ProfileHeader
          title={club.name}
          avatar={<ClubLogo name={club.name} logoUrl={club.logoUrl} size="lg" />}
          bannerUrl={club.bannerUrl}
          accentColor={club.accentColor}
          headline={club.headline}
          location={location}
          subtitle={subtitle || null}
          chips={clubProfileTagLabels(club.tags)}
          badges={
            <Badge variant={club.verified ? 'success' : 'warning'}>
              {club.verified ? 'Verified' : 'Pending verification'}
            </Badge>
          }
          actions={
            <Link
              href="/dashboard/club/profile/edit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Edit club profile
            </Link>
          }
          coverEditor={
            <ClubCoverEditor hasBanner={Boolean(club.bannerUrl)} redirectTo={PROFILE_REDIRECT} />
          }
          photoEditor={
            <ClubLogoEditor hasLogo={Boolean(club.logoUrl)} redirectTo={PROFILE_REDIRECT} />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ClubProfileStats
            openOpportunities={openOpportunities}
            applications={applications.length}
            pendingApplications={pendingApplications}
            requirements={openRequirements}
            inquiries={inquiries}
            staff={staff}
            posts={posts}
            liveSessions={liveSessions}
          />

          <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <CardContent>
              <h2 className="mb-3 font-semibold">Club information</h2>
              <ProfileGrid rows={rows} />
            </CardContent>
          </Card>

          {club.description ? (
            <Card className="animate-fade-up" style={{ animationDelay: '200ms' }}>
              <CardContent>
                <h2 className="mb-2 font-semibold">About the club</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{club.description}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <ProfileChecklistCard
            state={checklist}
            completeText="Complete profile: players and their families see everything they look for."
          />

          <Card className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <CardContent className="flex flex-col gap-1">
              <h2 className="mb-2 font-semibold">Manage your club</h2>
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

      {/* Muro: las publicaciones del club en Discovery, como en un perfil social. */}
      <section id="publicaciones" className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Club posts</h2>
          <Link href="/dashboard/discovery" className="text-sm text-primary hover:underline">
            Post on Discovery →
          </Link>
        </div>
        {myPosts.length === 0 ? (
          <Card className="animate-fade-up">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have not posted anything yet. Announce a trial, a signing or a milestone on
                Discovery and it will appear here.
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

