import Link from 'next/link';
import { ROLE_LABELS } from '@ifpc/config';
import { Card, CardContent } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import type { SuggestedProfile } from '@/lib/discovery';
import { nameParts } from '@/lib/names';
import { FollowButton } from './follow-button';

/**
 * Perfiles sugeridos: los más seguidos que el espectador todavía no sigue (por
 * eso siempre se pintan como "Seguir").
 */
export function SuggestedProfiles({ profiles }: { profiles: SuggestedProfile[] }) {
  if (profiles.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Perfiles sugeridos</h2>
        <ul className="flex flex-col gap-3">
          {profiles.map((profile) => {
            const { firstName, lastName } = nameParts(profile.name);
            return (
              <li key={profile.id} className="flex items-center gap-3">
                <Link
                  href={`/dashboard/discovery/u/${profile.id}`}
                  aria-label={profile.name}
                  className="shrink-0"
                >
                  <PlayerAvatar
                    firstName={firstName}
                    lastName={lastName}
                    imageUrl={profile.image}
                    size="sm"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/discovery/u/${profile.id}`}
                    className="block truncate text-sm font-medium hover:text-emerald-400"
                  >
                    {profile.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[profile.role] ?? profile.role} · {profile.posts}{' '}
                    {profile.posts === 1 ? 'publicación' : 'publicaciones'}
                  </span>
                </div>
                <FollowButton userId={profile.id} isFollowing={false} compact />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
