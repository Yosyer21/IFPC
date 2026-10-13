import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import {
  createClubLiveSessionAction,
  deleteClubLiveSessionAction,
} from '@/app/actions/live-sessions';
import {
  LIVE_SESSION_TYPE_LABELS,
  LIVE_SESSION_VISIBILITY_LABELS,
} from '@/lib/labels';

export const metadata: Metadata = { title: 'Live sessions' };

export default async function ClubLiveSessionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    include: {
      liveSessions: { orderBy: { startsAt: 'desc' }, take: 100 },
    },
  });
  if (!club) notFound();

  const inputClass = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Live sessions"
        subtitle="Host live sessions for your club — or publish a public one on Discovery"
        icon="live"
      />

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-3 font-semibold">Schedule a live session</h2>
          <form
            action={createClubLiveSessionAction}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <label className="text-sm sm:col-span-2">
              Title *
              <input required name="title" className={inputClass} placeholder="Live training…" />
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea name="description" rows={3} className={inputClass} />
            </label>
            <label className="text-sm">
              Type
              <select name="type" defaultValue="TRAINING" className={inputClass}>
                {Object.entries(LIVE_SESSION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Visibility
              <select name="visibility" defaultValue="CLUB" className={inputClass}>
                {Object.entries(LIVE_SESSION_VISIBILITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Starts *
              <input required type="datetime-local" name="startsAt" className={inputClass} />
            </label>
            <label className="text-sm">
              Ends
              <input type="datetime-local" name="endsAt" className={inputClass} />
            </label>
            <label className="text-sm sm:col-span-2">
              Meeting link
              <input name="meetingUrl" className={inputClass} placeholder="https://meet.google.com/…" />
            </label>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Club only: visible just for your club (staff and contracted players). Public: it is
              also announced on Discovery.
            </p>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2"
            >
              Schedule session
            </button>
          </form>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Your club sessions ({club.liveSessions.length})</h2>
      {club.liveSessions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven&rsquo;t scheduled any live session yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {club.liveSessions.map((liveSession) => (
            <div
              key={liveSession.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span>{liveSession.title}</span>
                  <StatusBadge status={liveSession.status} />
                  <Badge variant={liveSession.visibility === 'PUBLIC' ? 'success' : 'outline'}>
                    {LIVE_SESSION_VISIBILITY_LABELS[liveSession.visibility] ?? liveSession.visibility}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {LIVE_SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type} ·{' '}
                  {liveSession.startsAt.toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
              <form action={deleteClubLiveSessionAction}>
                <input type="hidden" name="sessionId" value={liveSession.id} />
                <button
                  type="submit"
                  className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
