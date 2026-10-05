import { matchScore, type MatchRequirement, type MatchScore } from '@ifpc/matching';

/**
 * Minimum score for an opportunity to count as "for you".
 * Matches the engine's "good match" threshold (>= 60).
 */
export const PLAYER_MATCH_THRESHOLD = 60;

interface MatchablePlayer {
  position: string | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  competitionLevel: string | null;
  status: string;
}

interface MatchableOpportunity {
  position: string | null;
  ageMin: number | null;
  ageMax: number | null;
}

/**
 * Requirements expressed by an opportunity.
 * `Opportunity` has no competition level, country or club location, so those
 * criteria stay neutral instead of penalising every player (see
 * docs/technical/matching-engine.md).
 */
function opportunityRequirement(opportunity: MatchableOpportunity): MatchRequirement {
  return {
    position: opportunity.position,
    ageMin: opportunity.ageMin,
    ageMax: opportunity.ageMax,
  };
}

/** Match between a player profile and an opportunity. */
export function matchOpportunity(
  player: MatchablePlayer,
  opportunity: MatchableOpportunity
): MatchScore {
  return matchScore(player, opportunityRequirement(opportunity));
}
