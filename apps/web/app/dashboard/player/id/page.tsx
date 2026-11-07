import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { COMPETITION_LEVEL_LABELS, POSITION_LABELS } from '@ifpc/config';
import { PlayerIdView } from '@/components/preview/player-id-view';

export const metadata: Metadata = { title: 'Player ID' };

function ageOf(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '—'
  );
}

export default async function PlayerIdPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { career: { orderBy: [{ isCurrent: 'desc' }, { season: 'desc' }] } },
  });
  if (!player) notFound();

  const posLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';
  const compLabel = player.competitionLevel
    ? ((COMPETITION_LEVEL_LABELS as Record<string, string | undefined>)[player.competitionLevel] ??
      player.competitionLevel)
    : null;

  const totals = player.career.reduce(
    (acc, entry) => ({
      apps: acc.apps + entry.appearances,
      goals: acc.goals + entry.goals,
      assists: acc.assists + entry.assists,
    }),
    { apps: 0, goals: 0, assists: 0 }
  );
  const goalsPerMatch = totals.apps > 0 ? (totals.goals / totals.apps).toFixed(2) : '0.00';

  const career = [
    { value: String(totals.goals), label: 'Goals' },
    { value: String(totals.apps), label: 'Matches' },
    { value: String(totals.assists), label: 'Assists' },
    { value: goalsPerMatch, label: 'Goals per match' },
  ];

  const age = ageOf(player.dateOfBirth);
  const details: [string, string][] = [
    ['Age', age != null ? String(age) : '—'],
    ['Foot', player.foot ?? '—'],
    ['Height', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Position', posLabel],
  ];

  const seasons = player.career.map((entry) => {
    const goalInvolvements = entry.goals + entry.assists;
    const max = Math.max(entry.appearances, entry.goals, entry.assists, goalInvolvements, 1);
    const pct = (value: number) => Math.round((value / max) * 100);
    return {
      year: entry.season,
      current: entry.isCurrent,
      crest: initials(entry.clubName),
      club: entry.clubName,
      category:
        [entry.category, posLabel]
          .filter((part): part is string => Boolean(part) && part !== '—')
          .join(' · ') || '—',
      stats: [
        { label: 'Matches', value: String(entry.appearances), pct: pct(entry.appearances) },
        { label: 'Goals', value: String(entry.goals), pct: pct(entry.goals) },
        { label: 'Assists', value: String(entry.assists), pct: pct(entry.assists) },
        { label: 'Goal inv.', value: String(goalInvolvements), pct: pct(goalInvolvements) },
      ],
    };
  });

  const academyLine =
    [compLabel, posLabel !== '—' ? posLabel : null].filter(Boolean).join(' · ') || 'Player profile';

  return (
    <div className="mx-auto max-w-5xl">
      <PlayerIdView
        data={{
          name: `${player.firstName} ${player.lastName}`.trim(),
          academyLine,
          career,
          details,
          seasons,
          addSeasonHref: '/dashboard/player/career',
          addPhotoHref: '/dashboard/player/profile',
        }}
      />
    </div>
  );
}
