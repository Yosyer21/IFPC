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

export const metadata: Metadata = { title: 'Siguiendo y preferencias' };

/** Roles que se muestran como organización (clubes, universidades y escuelas). */
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
        ← Volver al feed
      </Link>

      <PageHeader
        title="Siguiendo y preferencias"
        subtitle={`${stats.following} siguiendo · ${stats.followers} ${
          stats.followers === 1 ? 'seguidor' : 'seguidores'
        }`}
        icon="users"
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold">Tus preferencias</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A quien sigues se le da prioridad en «Para ti» y «Tendencias». Aquí puedes afinarlo
              perfil a perfil: «ver más» lo sube y «ver menos» lo saca de esos dos listados (en
              «Recientes» y «Siguiendo» sus publicaciones siguen apareciendo).
            </p>
          </div>

          <PreferenceRow
            title="Ver más"
            entries={preferences.filter((entry) => entry.kind === 'MORE')}
            emptyMessage="Todavía no has pedido ver más de nadie."
          />
          <PreferenceRow
            title="Ver menos"
            entries={preferences.filter((entry) => entry.kind === 'LESS')}
            emptyMessage="No has descartado a nadie."
          />
        </CardContent>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">
          A quién sigues <span className="text-muted-foreground">({following.length})</span>
        </h2>

        {following.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Todavía no sigues a nadie. Desde el feed (o desde el directorio de perfiles) puedes
                seguir a quien te interese: así empezarás a ver más de su contenido.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {organizations.length > 0 ? (
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clubes, universidades y escuelas
              </h3>
            ) : null}
            {organizations.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} viewerId={viewerId} />
            ))}

            {people.length > 0 ? (
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Personas
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
          Quién te sigue <span className="text-muted-foreground">({followers.length})</span>
        </h2>

        {followers.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Todavía no te sigue nadie.</p>
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
              title={`Quitar la preferencia de ${entry.name}`}
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
