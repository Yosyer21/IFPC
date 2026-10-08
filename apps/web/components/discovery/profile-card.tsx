import Link from 'next/link';
import { ROLE_LABELS } from '@ifpc/config';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import type { ProfileSummary } from '@/lib/discovery-content';
import { nameParts } from '@/lib/names';
import { FollowButton } from './follow-button';

/**
 * Tarjeta de un perfil del directorio. Con `viewerId` se muestra el botón de
 * seguir (salvo en tu propio perfil) y con `readOnly` no hay acciones.
 */
export function ProfileCard({
  profile,
  viewerId,
  base = '/dashboard/discovery',
  readOnly = false,
}: {
  profile: ProfileSummary;
  viewerId?: string;
  base?: string;
  readOnly?: boolean;
}) {
  const { firstName, lastName } = nameParts(profile.name);
  const isSelf = viewerId === profile.id;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Link href={`${base}/u/${profile.id}`} aria-label={profile.name} className="shrink-0">
          <PlayerAvatar
            firstName={firstName}
            lastName={lastName}
            imageUrl={profile.image}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`${base}/u/${profile.id}`}
            className="block truncate font-semibold hover:text-emerald-400"
          >
            {profile.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
            <span className="text-xs text-muted-foreground">
              {profile.posts} {profile.posts === 1 ? 'publicación' : 'publicaciones'} ·{' '}
              {profile.followers} {profile.followers === 1 ? 'seguidor' : 'seguidores'}
            </span>
          </div>
        </div>
        {readOnly || isSelf ? null : (
          <FollowButton userId={profile.id} isFollowing={profile.isFollowing} compact />
        )}
      </CardContent>
    </Card>
  );
}
