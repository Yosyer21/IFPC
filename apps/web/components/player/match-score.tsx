import { Badge, Progress } from '@ifpc/ui';
import type { MatchScore } from '@ifpc/matching';

/** Colour code shared by the match badges: 80+ strong, 60+ good. */
function variantFor(score: number): 'success' | 'warning' | 'default' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'default';
}

/** Compact match score, e.g. "72% match". */
export function MatchScoreBadge({ score }: { score: number }) {
  return <Badge variant={variantFor(score)}>{score}% match</Badge>;
}

/** Criterion-by-criterion explanation of a match score. */
export function MatchBreakdown({ result }: { result: MatchScore }) {
  return (
    <div className="flex flex-col gap-3">
      {result.criteria.map((criterion) => (
        <div key={criterion.key}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{criterion.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {criterion.score}/{criterion.max}
            </span>
          </div>
          <Progress
            value={criterion.max > 0 ? Math.round((criterion.score / criterion.max) * 100) : 0}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">{criterion.detail}</p>
        </div>
      ))}
    </div>
  );
}
