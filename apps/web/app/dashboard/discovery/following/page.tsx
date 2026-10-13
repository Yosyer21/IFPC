import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';
import { setAuthorPreferenceAction } from '@/app/actions/discovery';
import { ProfileCard } from '@/components/discovery/profile-card';
import { SuggestedProfiles } from '@/components/discovery/suggested-profiles';
import { PageHeader } from '@/components/player/page-header';
import {
  getFollowStats,
  listFollowers,
  listFollowing,
  listSuggestedProfiles,
} from '@/lib/discovery';
import { listAuthorPreferences } from '@/lib/discovery-preferences';

export const metadata: Metadata = { title: 'Following and preferences' };

/** Roles que se muestran como organización (clubs, universities y schools). */
const ORGANIZATION_ROLES = ['CLUB', 'UNIVERSITY', 'SCHOOL'];

/**
 * Tu red de Discovery: a quién sigues, quién te sigue y —lo que de verdad manda
 * en el ranking— tus preferencias (`ver más` / `ver menos`). Seguir a alguien ya
 * cuenta como «ver más» implícito: esto es el ajuste fino.
 */
export default async function FollowingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const viewerId = session.user.id;

  const [following, followers, stats, preferences, suggested] = await Promise.all([
    listFollowing(viewerId, viewerId),
    listFollowers(viewerId, viewerId),
    getFollowStats(viewerId, viewerId),
    listAuthorPreferences(viewerId),
    listSuggestedProfiles(viewerId),
  ]);

  const organizations = following.filter((profile) => ORGANIZATION_ROLES.includes(profile.role));
  const people = following.filter((profile) => !ORGANIZATION_ROLES.includes(profile.role));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/discovery"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to feed
      </Link>

      <PageHeader
        title="Following and preferences"
        subtitle={`${stats.following} siguiendo · ${stats.followers} ${
          stats.followers === 1 ? 'follower' : 'followers'
        }`}
        icon="users"
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold">Your preferences</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              People you follow are prioritised in “For you” and “Trending”. Here you can fine-tune it
              profile by profile: “Show more” moves them up and “Show less” takes them out of those two
              listings (their posts still appear under “Latest” and “Following”).
            </p>
          </div>

          <PreferenceRow
            title="Show more"
            entries={preferences.filter((entry) => entry.kind === 'MORE')}
            emptyMessage="You have not asked to see more from anyone yet."
          />
          <PreferenceRow
            title="Show less"
            entries={preferences.filter((entry) => entry.kind === 'LESS')}
            emptyMessage="You have not dismissed anyone."
          />
        </CardContent>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">
          Who you follow <span className="text-muted-foreground">({following.length})</span>
        </h2>

        {following.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You do not follow anyone yet. From the feed (or the profiles directory) you can follow
                whoever interests you: that way you will start seeing more of their content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {organizations.length > 0 ? (
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clubs, universities and schools
              </h3>
            ) : null}
            {organizations.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} viewerId={viewerId} />
            ))}

            {people.length > 0 ? (
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                People
              </h3>
            ) : null}
            {people.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} viewerId={viewerId} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">
          Who follows you <span className="text-muted-foreground">({followers.length})</span>
        </h2>

        {followers.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nobody follows you yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {followers.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} viewerId={viewerId} />
            ))}
          </div>
        )}
      </section>

      <SuggestedProfiles profiles={suggested} />
    </div>
  );
}

/** Chips de una preferencia, cada uno con su botón para quitarla. */
function PreferenceRow({
  title,
  entries,
  emptyMessage,
}: {
  title: string;
  entries: { id: string; name: string }[];
  emptyMessage: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{title}:</span>
      {entries.length === 0 ? (
        <span className="text-xs text-muted-foreground/70">{emptyMessage}</span>
      ) : (
        entries.map((entry) => (
          <form key={entry.id} action={setAuthorPreferenceAction}>
            <input type="hidden" name="userId" value={entry.id} />
            <input type="hidden" name="kind" value="" />
            <button
              type="submit"
              title={`Remove the preference for ${entry.name}`}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
            >
              {entry.name} ✕
            </button>
          </form>
        ))
      )}
    </div>
  );
}
