import { profileCompletionPercentage } from '@ifpc/config';
import type { Player } from '@ifpc/types';

/**
 * Player fields that count towards profile completion.
 * Single source of truth for the dashboard, profile and development pages.
 */
type PlayerCompletionFields = Pick<
  Player,
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'nationality'
  | 'position'
  | 'foot'
  | 'heightCm'
  | 'weightKg'
  | 'competitionLevel'
  | 'clubName'
  | 'bio'
>;

/** The completion-checked fields of a player, in display order. */
function playerProfileFields(player: PlayerCompletionFields): unknown[] {
  return [
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
}

/**
 * Profile completion (0-100) plus the raw counters the UI shows ("8/11 campos").
 */
export function playerProfileCompletion(player: PlayerCompletionFields): {
  percent: number;
  completed: number;
  total: number;
} {
  const fields = playerProfileFields(player);
  const completed = fields.filter(Boolean).length;
  return { percent: profileCompletionPercentage(fields), completed, total: fields.length };
}
