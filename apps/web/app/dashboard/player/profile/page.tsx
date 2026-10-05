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
} from '@ifpc/config';
import { PlayerAvatar } from '@/components/player/avatar';
import { ProfileGrid } from '@/components/player/profile-grid';
import { PhotoUploadForm } from '@/components/player/photo-upload-form';
import { StatusToggle } from '@/components/player/status-toggle';
import { DonutChart } from '@/components/player/charts';
import { playerProfileCompletion } from '@/lib/player';
import { getProfileViewStats } from '@/lib/profile-views';
import { removePlayerPhotoAction } from '@/app/actions/player';
import { IconTarget, IconTrendingUp, IconTrophy, IconWhistle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'My profile' };

export default async function PlayerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
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

  const { percent, completed: completedFields, total: totalFields } =
    playerProfileCompletion(player);
  const viewStats = await getProfileViewStats(player.id);

  const rows: [string, string][] = [
    ['Nombre', `${player.firstName} ${player.lastName}`],
    ['Email', player.user.email],
    ['Fecha de nacimiento', player.dateOfBirth ? player.dateOfBirth.toLocaleDateString('es') : '—'],
    ['Nacionalidad', player.nationality ?? '—'],
    ['Position', positionLabel],
    ['Preferred foot', footLabel],
    ['Nivel competitivo', competitionLabel],
    ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Club actual', player.clubName ?? '—'],
  ];

  const subLinks = [
    { href: '/dashboard/player/profile/football', label: 'Football profile', icon: IconTarget },
    { href: '/dashboard/player/profile/physical', label: 'Physical data', icon: IconTrendingUp },
    { href: '/dashboard/player/profile/technical', label: 'Technical level', icon: IconWhistle },
    { href: '/dashboard/player/career', label: 'Career history', icon: IconTrophy },
  ];


  return (
    <div className="mx-auto max-w-5xl">
      {/* Cabecera */}
      <div className="animate-fade-up mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PlayerAvatar
            firstName={player.firstName}
            lastName={player.lastName}
            imageUrl={player.user.image}
            size="md"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
            <p className="text-sm text-muted-foreground">
              {positionLabel}
              {competitionLabel !== '—' ? ` · ${competitionLabel}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusToggle status={player.status} />
          <Link
            href="/dashboard/player/profile/edit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
            {statusLabel}
          </Badge>

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
          <Card className="animate-fade-up" style={{ animationDelay: '140ms' }}>
            <CardContent className="flex flex-col items-center gap-3">
              <h2 className="self-start font-semibold">Foto de perfil</h2>
              <PhotoUploadForm
                firstName={player.firstName}
                lastName={player.lastName}
                imageUrl={player.user.image}
              />
              {player.user.image ? (
                <form action={removePlayerPhotoAction}>
                  <button type="submit" className="text-xs text-muted-foreground hover:underline">
                    Quitar foto
                  </button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="flex flex-col gap-3">
              <h2 className="font-semibold">Interés en tu perfil</h2>
              {viewStats.viewers === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía nadie ha visto tu perfil. Compártelo y mantén tus datos y vídeos al día
                  para que clubes y ojeadores te encuentren.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-5">
                    <div>
                      <div className="text-2xl font-bold tabular-nums">{viewStats.viewers}</div>
                      <div className="text-xs text-muted-foreground">Interesados</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums">{viewStats.views}</div>
                      <div className="text-xs text-muted-foreground">Visitas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums">{viewStats.newThisWeek}</div>
                      <div className="text-xs text-muted-foreground">Nuevos (7 días)</div>
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

          <Card className="animate-fade-up flex flex-col items-center" style={{ animationDelay: '160ms' }}>
            <CardContent className="flex w-full flex-col items-center gap-4">
              <h2 className="self-start font-semibold">Profile complete</h2>
              <DonutChart
                value={percent}
                label={`${percent}%`}
                sublabel={`${completedFields}/${totalFields} campos`}
              />
              {percent < 100 ? (
                <Link
                  href="/dashboard/player/profile/edit"
                  className="text-sm text-primary hover:underline"
                >
                  Complete profile →
                </Link>
              ) : null}
            </CardContent>
          </Card>

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
    </div>
  );
}
