import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { matchScore } from '@ifpc/matching';
import { FOOT_LABELS } from '@ifpc/config';
import { Card, CardContent } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import {
  SCOUTING_AGE_FILTERS,
  SCOUTING_POSITION_FILTERS,
  ageGroupLabel,
  ageOn,
  matchesScoutingFilters,
  parseScoutingFilters,
  positionLabel,
  scoutingAgeGroup,
  scoutingHref,
} from '@/lib/club-scouting';
import { invitePlayerToTrialAction, toggleClubShortlistAction } from '@/app/actions/club';

export const metadata: Metadata = { title: 'Find players' };

const BASE_PATH = '/dashboard/club/players';

const CHIP =
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors';
const CHIP_ON = 'border-ink bg-ink text-white';
const CHIP_OFF =
  'border-border bg-card text-muted-foreground hover:border-ink/30 hover:text-foreground';

/**
 * «Find players»: scouting del club. Sustituye a la antigua lista de jugadores
 * con el diseño nuevo: cabecera oscura, filtros por demarcación/edad, stats
 * reales de trayectoria, clips del Film Room, fit contra los requirements del
 * club, shortlist propia y invitación a prueba.
 */
export default async function ClubPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; age?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const params = await searchParams;
  const filters = parseScoutingFilters({ position: params.position, age: params.age });
  const currentHref = scoutingHref(BASE_PATH, filters);

  const [players, requirements, shortlist, trials] = await Promise.all([
    prisma.player.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        user: { select: { image: true } },
        _count: { select: { videos: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    }),
    prisma.requirement.findMany({ where: { clubId: club.id, status: 'OPEN' } }),
    prisma.clubShortlist.findMany({ where: { clubId: club.id }, select: { playerId: true } }),
    prisma.trial.findMany({
      where: { clubId: club.id, status: 'SCHEDULED' },
      select: { playerId: true },
    }),
  ]);

  const career = players.length
    ? await prisma.careerEntry.groupBy({
        by: ['playerId'],
        where: { playerId: { in: players.map((player) => player.id) } },
        _sum: { appearances: true, goals: true, assists: true },
      })
    : [];

  const careerByPlayer = new Map(career.map((row) => [row.playerId, row._sum]));
  const shortlisted = new Set(shortlist.map((row) => row.playerId));
  const invited = new Set(trials.map((row) => row.playerId));
  const now = new Date();

  const rows = players
    .filter((player) => matchesScoutingFilters(player, filters, now))
    .map((player) => {
      const sum = careerByPlayer.get(player.id);
      const ageGroup = scoutingAgeGroup(ageOn(player.dateOfBirth, now));
      const fit = requirements.length
        ? Math.max(
            ...requirements.map(
              (requirement) =>
                matchScore(
                  {
                    position: player.position,
                    dateOfBirth: player.dateOfBirth,
                    nationality: player.nationality,
                    competitionLevel: player.competitionLevel,
                    status: player.status,
                  },
                  {
                    position: requirement.position,
                    ageMin: requirement.ageMin,
                    ageMax: requirement.ageMax,
                    level: requirement.level,
                    country: requirement.country,
                  }
                ).total
            )
          )
        : null;

      const foot = player.foot
        ? ((FOOT_LABELS as Record<string, string | undefined>)[player.foot] ?? player.foot)
        : null;

      return {
        player,
        ageGroup: ageGroup ? ageGroupLabel(ageGroup) : null,
        foot,
        apps: sum?.appearances ?? 0,
        goals: sum?.goals ?? 0,
        assists: sum?.assists ?? 0,
        fit,
      };
    })
    .sort(
      (a, b) => (b.fit ?? -1) - (a.fit ?? -1) || a.player.lastName.localeCompare(b.player.lastName)
    );

  return (
    <div className="mx-auto max-w-6xl">
      {/* Cabecera de scouting. */}
      <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-[90px]"
        />
        <div
          aria-hidden="true"
          className="bg-bars-faint-invert pointer-events-none absolute inset-0 opacity-40"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-ink">
            Scouting
          </span>
          <h1 className="mt-4 text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-5xl">
            Find players
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60">
            Verified profiles, real stats and Film Room highlights.
          </p>

          <dl className="mt-6 grid max-w-md grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Players
              </dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-white">{rows.length}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Shortlisted
              </dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-brand">
                {shortlist.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Filtros: demarcación y edad. */}
      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Filter by position">
        {SCOUTING_POSITION_FILTERS.map((filter) => {
          const active = filters.position === filter.id;
          return (
            <Link
              key={filter.id}
              href={scoutingHref(BASE_PATH, { ...filters, position: filter.id })}
              aria-current={active ? 'true' : undefined}
              className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Filter by age">
        {SCOUTING_AGE_FILTERS.map((filter) => {
          const active = filters.age === filter.id;
          return (
            <Link
              key={filter.id}
              href={scoutingHref(BASE_PATH, { ...filters, age: filter.id })}
              aria-current={active ? 'true' : undefined}
              className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {/* Lista de jugadores. */}
      {rows.length === 0 ? (
        <Card className="mt-5">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No players match these filters yet. Try another position or age group.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {rows.map(({ player, ageGroup, foot, apps, goals, assists, fit }, index) => {
            const isShortlisted = shortlisted.has(player.id);
            const isInvited = invited.has(player.id);
            const clips = player._count.videos;

            return (
              <Card
                key={player.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
              >
                <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <PlayerAvatar
                      firstName={player.firstName}
                      lastName={player.lastName}
                      imageUrl={player.user.image}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {positionLabel(player.position)}
                        {ageGroup ? ` · ${ageGroup}` : ''}
                      </p>
                      <h2 className="truncate text-lg font-black uppercase leading-tight">
                        <Link
                          href={`${BASE_PATH}/${player.id}`}
                          className="transition-colors hover:text-brand"
                        >
                          {player.firstName} {player.lastName}
                        </Link>
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {[player.clubName, player.location, foot].filter(Boolean).join(' · ') ||
                          'Profile details pending'}
                      </p>
                    </div>
                  </div>

                  <dl className="flex shrink-0 items-end gap-4 sm:gap-6">
                    {[
                      { label: 'Apps', value: apps },
                      { label: 'Goals', value: goals },
                      { label: 'Assists', value: assists },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <dd className="text-xl font-black tabular-nums leading-none">
                          {stat.value}
                        </dd>
                        <dt className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {stat.label}
                        </dt>
                      </div>
                    ))}
                  </dl>

                  <div className="shrink-0 text-xs text-muted-foreground lg:w-32 lg:text-right">
                    <p>
                      {clips} highlight clip{clips === 1 ? '' : 's'}
                    </p>
                    {fit !== null ? (
                      <p className="mt-0.5 text-sm font-bold text-[#4f6b0a]">{fit}% fit</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <form action={toggleClubShortlistAction}>
                      <input type="hidden" name="playerId" value={player.id} />
                      <input type="hidden" name="returnTo" value={currentHref} />
                      <button
                        type="submit"
                        aria-pressed={isShortlisted}
                        className={
                          isShortlisted
                            ? 'rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-ink'
                            : 'rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted'
                        }
                      >
                        {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                      </button>
                    </form>

                    {isInvited ? (
                      <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        Invite sent
                      </span>
                    ) : (
                      <form action={invitePlayerToTrialAction}>
                        <input type="hidden" name="playerId" value={player.id} />
                        <input type="hidden" name="returnTo" value={currentHref} />
                        <button
                          type="submit"
                          className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-ink/90"
                        >
                          Invite to trial
                        </button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
