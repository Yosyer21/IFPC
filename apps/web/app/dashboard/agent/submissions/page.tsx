import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'Submissions' };

/** Etapa del proceso de fichaje: etiqueta y color. */
const STAGE: Record<string, { label: string; tone: string }> = {
  SUBMISSION: { label: 'Submission', tone: 'fb-tag-gray' },
  TRIAL: { label: 'Trial', tone: 'fb-tag-violet' },
  NEGOTIATION: { label: 'Negotiation', tone: 'fb-tag-amber' },
  CONTRACT: { label: 'Contract', tone: 'fb-tag-lime' },
};

export default async function AgentSubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const submissions = await prisma.submission.findMany({
    where: { agentId: agent.id },
    include: { player: true, club: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Submissions" subtitle="Players submitted to clubs and their status" icon="mail">
        <Link
          href="/dashboard/agent/submissions/new"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:brightness-95"
        >
          New submission
        </Link>
      </PageHeader>

      {submissions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven't submitted players to clubs yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((submission) => {
            const stage = STAGE[submission.stage] ?? {
              label: submission.stage,
              tone: 'fb-tag-gray',
            };
            return (
              <Link
                key={submission.id}
                href={`/dashboard/agent/submissions/${submission.id}`}
                className="group block"
              >
                <Card className="card-hover">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold leading-snug">
                        {submission.player.firstName} {submission.player.lastName}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="fb-tag fb-tag-gray">{submission.club.name}</span>
                        <span className={`fb-tag ${stage.tone}`}>{stage.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sent on {submission.createdAt.toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <StatusBadge status={submission.status} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
