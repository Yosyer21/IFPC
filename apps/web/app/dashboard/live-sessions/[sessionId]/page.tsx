import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { LIVE_SESSION_TYPE_LABELS, LIVE_SESSION_VISIBILITY_LABELS } from '@/lib/labels';
import { canViewLiveSession } from '@/lib/live-sessions';

export const metadata: Metadata = { title: 'Live session' };

/**
 * Vista compartida de un live (a la que apunta el anuncio de Discovery y los
 * correos). El acceso depende de la visibilidad: pública, de club o 1:1.
 */
export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: { coach: { include: { user: true } }, club: true },
  });
  if (!liveSession) notFound();

  const allowed = await canViewLiveSession(
    { id: session.user.id, role: session.user.role },
    liveSession
  );
  if (!allowed) notFound();

  const isUpcoming = liveSession.startsAt > new Date();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={liveSession.title}
        subtitle={`${LIVE_SESSION_TYPE_LABELS[liveSession.type] ?? liveSession.type} · ${
          liveSession.club?.name ?? liveSession.coach?.user?.name ?? 'Future Baller'
        }`}
        icon="live"
      >
        <Link href="/dashboard/discovery" className="text-sm text-muted-foreground hover:underline">
          ← Discovery
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={liveSession.status} />
            <Badge variant="outline">
              {LIVE_SESSION_VISIBILITY_LABELS[liveSession.visibility] ?? liveSession.visibility}
            </Badge>
            <Badge variant="outline">
              {liveSession.startsAt.toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {liveSession.endsAt
                ? ` → ${liveSession.endsAt.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ''}
            </Badge>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {liveSession.description ?? 'No description.'}
          </p>

          {isUpcoming && liveSession.status !== 'CANCELLED' && liveSession.meetingUrl ? (
            <a
              href={liveSession.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 px-5 py-2.5 text-sm font-semibold text-emerald-950"
            >
              Join the session
            </a>
          ) : (
            <p className="mt-5 text-xs text-muted-foreground">
              {liveSession.status === 'CANCELLED'
                ? 'This session has been cancelled.'
                : isUpcoming
                  ? 'The join link will activate when the session starts.'
                  : 'This session has ended.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
