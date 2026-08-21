import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import {
  COMPETITION_LEVEL_LABELS,
  FOOT_LABELS,
  PLAYER_STATUS_LABELS,
  POSITION_LABELS,
} from '@future-buller/config';
import { StatusToggle } from '@/components/player/status-toggle';
import { DonutChart } from '@/components/player/charts';
import { IconTarget, IconTrendingUp, IconUser, IconWhistle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Mi perfil' };

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

  // % de perfil completado
  const fields = [
    player.firstName,
    player.lastName,
    player.dateOfBirth,
    player.nationality,
    player.position,
    player.foot,
    player.heightCm,
    player.weightKg,
    player.competitionLevel,
    player.clubName,
    player.bio,
  ];
  const completedFields = fields.filter(Boolean).length;
  const percent = Math.round((completedFields / fields.length) * 100);

  const rows: [string, string][] = [
    ['Nombre', `${player.firstName} ${player.lastName}`],
    ['Email', player.user.email],
    ['Fecha de nacimiento', player.dateOfBirth ? player.dateOfBirth.toLocaleDateString('es') : '—'],
    ['Nacionalidad', player.nationality ?? '—'],
    ['Posición', positionLabel],
    ['Pierna hábil', footLabel],
    ['Nivel competitivo', competitionLabel],
    ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Club actual', player.clubName ?? '—'],
  ];

  const subLinks = [
    { href: '/dashboard/player/profile/football', label: 'Ficha futbolística', icon: IconTarget },
    { href: '/dashboard/player/profile/physical', label: 'Datos físicos', icon: IconTrendingUp },
    { href: '/dashboard/player/profile/technical', label: 'Nivel técnico', icon: IconWhistle },
  ];


  return (
    <div className="mx-auto max-w-5xl">
      {/* Cabecera */}
      <div className="animate-fade-up mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconUser className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
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
            Editar perfil
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
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {player.bio ? (
            <Card className="animate-fade-up" style={{ animationDelay: '200ms' }}>
              <CardContent>
                <h2 className="mb-2 font-semibold">Biografía</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{player.bio}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="animate-fade-up flex flex-col items-center" style={{ animationDelay: '160ms' }}>
            <CardContent className="flex w-full flex-col items-center gap-4">
              <h2 className="self-start font-semibold">Perfil completado</h2>
              <DonutChart
                value={percent}
                label={`${percent}%`}
                sublabel={`${completedFields}/${fields.length} campos`}
              />
              {percent < 100 ? (
                <Link
                  href="/dashboard/player/profile/edit"
                  className="text-sm text-primary hover:underline"
                >
                  Completar perfil →
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <CardContent className="flex flex-col gap-1">
              <h2 className="mb-2 font-semibold">Mi ficha</h2>
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
