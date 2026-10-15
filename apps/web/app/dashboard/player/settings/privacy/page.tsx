import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Avatar, Badge, Card, CardContent } from '@ifpc/ui';
import { PLAYER_STATUS_LABELS, ROLE_LABELS } from '@ifpc/config';
import { toggleBlockAction, toggleMuteAction } from '@/app/actions/discovery';
import { ActionSubmit } from '@/components/discovery/action-submit';
import { PageHeader } from '@/components/player/page-header';
import { StatusToggle } from '@/components/player/status-toggle';

export const metadata: Metadata = { title: 'Privacy' };

type HiddenProfile = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

/**
 * Privacidad del jugador: quién puede encontrar su perfil (según su estado de
 * disponibilidad) y las listas de perfiles **bloqueados** y **silenciados**.
 * Las reglas son las mismas `PrivacyRule` que usa Discovery, así que se deshacen
 * igual desde aquí o desde un muro.
 */
export default async function PlayerPrivacySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [player, rules] = await Promise.all([
    prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true, status: true },
    }),
    prisma.privacyRule.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { target: { select: { id: true, name: true, image: true, role: true } } },
    }),
  ]);

  const statusLabel = player
    ? ((PLAYER_STATUS_LABELS as Record<string, string | undefined>)[player.status] ?? player.status)
    : null;
  const available = player?.status === 'AVAILABLE';
  const blocked = rules.filter((rule) => rule.kind === 'BLOCK').map((rule) => rule.target);
  const muted = rules.filter((rule) => rule.kind === 'MUTE').map((rule) => rule.target);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Privacy" subtitle="Who can find you and who you have hidden" icon="shield">
        <Link
          href="/dashboard/player/settings"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Settings
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <Card className="animate-fade-up">
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Profile visibility</h2>
              {statusLabel ? (
                <Badge variant={available ? 'success' : 'outline'}>{statusLabel}</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              While you are <strong>Available</strong>, verified clubs, scouts and agents can find
              you in their searches and see your details, videos and assessments. If you mark
              yourself as unavailable you stay on the platform, but you disappear from those
              searches.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {player ? <StatusToggle status={player.status} size="sm" /> : null}
              {player ? (
                <Link
                  href={`/players/${player.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  See my public profile →
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <HiddenProfilesCard
          title="Blocked profiles"
          description="You stop seeing each other's content and you cannot follow each other. The other person is not told you blocked them, and you can undo it at any time."
          emptyText="You have not blocked anyone. You can block a profile from its wall in Discovery."
          action={toggleBlockAction}
          actionLabel="Unblock"
          profiles={blocked}
        />

        <HiddenProfilesCard
          title="Muted profiles"
          description="You stop seeing their posts in Discovery (For you and Trending), but they still see yours. They are not notified."
          emptyText="You have not muted anyone."
          action={toggleMuteAction}
          actionLabel="Unmute"
          profiles={muted}
        />

        <Card className="animate-fade-up">
          <CardContent className="flex flex-col gap-2">
            <h2 className="font-semibold">Where these rules apply</h2>
            <p className="text-sm text-muted-foreground">
              Blocks and mutes work inside the platform, in <strong>Discovery</strong>. Your public
              profile page keeps showing only what you have published, and your private
              conversations stay yours alone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Lista de perfiles ocultos, cada uno con el botón que deshace la regla. */
function HiddenProfilesCard({
  title,
  description,
  emptyText,
  action,
  actionLabel,
  profiles,
}: {
  title: string;
  description: string;
  emptyText: string;
  action: (formData: FormData) => Promise<void>;
  actionLabel: string;
  profiles: HiddenProfile[];
}) {
  return (
    <Card className="animate-fade-up">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {profiles.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>

        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">{emptyText}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex items-center gap-3 py-2.5">
                <Avatar src={profile.image} alt={profile.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </p>
                </div>
                <form action={action}>
                  <input type="hidden" name="userId" value={profile.id} />
                  <ActionSubmit label={actionLabel} />
                </form>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
