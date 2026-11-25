import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';
import { scholarshipSummary } from '@/lib/scholarships';
import {
  decideNegotiationApprovalAction,
  decideScholarshipApprovalAction,
  decideTrialApprovalAction,
} from '@/app/actions/parent';

export const metadata: Metadata = { title: 'Approvals · Parent' };

function DecisionButtons({
  kind,
  id,
}: {
  kind: 'trial' | 'negotiation' | 'scholarship';
  id: string;
}) {
  const action =
    kind === 'trial'
      ? decideTrialApprovalAction
      : kind === 'negotiation'
        ? decideNegotiationApprovalAction
        : decideScholarshipApprovalAction;
  const field =
    kind === 'trial' ? 'trialId' : kind === 'negotiation' ? 'negotiationId' : 'applicationId';

  return (
    <div className="flex flex-wrap gap-2">
      <form action={action}>
        <input type="hidden" name={field} value={id} />
        <input type="hidden" name="decision" value="approve" />
        <button
          type="submit"
          className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-ink/90"
        >
          Approve
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name={field} value={id} />
        <input type="hidden" name="decision" value="decline" />
        <button
          type="submit"
          className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
        >
          Decline
        </button>
      </form>
    </div>
  );
}

/** Bandeja de aprobación del padre: pruebas y ofertas de sus hijos. */
export default async function ParentApprovalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { children: { select: { playerId: true } } },
  });
  if (!parent) notFound();

  const childIds = parent.children.map((child) => child.playerId);

  const [trials, negotiations, scholarshipApplications, recentTrials] = await Promise.all([
    prisma.trial.findMany({
      where: { playerId: { in: childIds }, parentApproval: 'PENDING', status: 'SCHEDULED' },
      include: { player: true, club: true },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.negotiation.findMany({
      where: {
        playerId: { in: childIds },
        parentApproval: 'PENDING',
        status: { in: ['OPEN', 'ONGOING'] },
      },
      include: { player: true, club: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.findMany({
      where: {
        playerId: { in: childIds },
        parentApproval: 'PENDING',
        status: 'PENDING',
        opportunity: { type: 'SCHOLARSHIP' },
      },
      include: {
        player: true,
        opportunity: {
          select: {
            id: true,
            title: true,
            scholarship: true,
            university: { select: { name: true } },
            school: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.trial.findMany({
      where: {
        playerId: { in: childIds },
        parentApproval: { in: ['APPROVED', 'DECLINED'] },
        parentDecisionAt: { not: null },
      },
      include: { player: true, club: true },
      orderBy: { parentDecisionAt: 'desc' },
      take: 5,
    }),
  ]);

  const pending = trials.length + negotiations.length + scholarshipApplications.length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Approvals"
        subtitle="Trials and offers for your children that need your decision"
        icon="shield"
      />

      <Card className="mb-6 border-brand/40 bg-brand/5">
        <CardContent>
          <p className="text-sm font-medium">
            {pending === 0
              ? 'Nothing is waiting for you right now.'
              : `${pending} decision${pending === 1 ? '' : 's'} pending.`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            For under-16 players, a trial or contract offer only counts once a parent approves it.
            Declining cancels the trial or closes the offer.
          </p>
        </CardContent>
      </Card>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-bold tracking-tight">Trials</h2>
        {trials.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">No trials waiting for approval.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {trials.map((trial) => (
              <Card key={trial.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <PlayerAvatar
                      firstName={trial.player.firstName}
                      lastName={trial.player.lastName}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {trial.player.firstName} {trial.player.lastName} · {trial.club.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {trial.startsAt.toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                        {trial.location ? ` · ${trial.location}` : ''}
                      </p>
                      {trial.notes ? (
                        <p className="mt-1 text-xs text-muted-foreground">{trial.notes}</p>
                      ) : null}
                    </div>
                  </div>
                  <DecisionButtons kind="trial" id={trial.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-bold tracking-tight">Scholarship offers</h2>
        {scholarshipApplications.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No scholarship offers waiting for approval.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {scholarshipApplications.map((application) => (
              <Card key={application.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {application.player.firstName} {application.player.lastName} ·{' '}
                      {application.opportunity.university?.name ??
                        application.opportunity.school?.name ??
                        'Programme'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {application.opportunity.title}
                    </p>
                    {application.opportunity.scholarship ? (
                      <p className="mt-1 text-xs font-semibold text-[#4f6b0a]">
                        {scholarshipSummary(application.opportunity.scholarship)}
                      </p>
                    ) : null}
                  </div>
                  <DecisionButtons kind="scholarship" id={application.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-bold tracking-tight">Contract offers</h2>
        {negotiations.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No contract offers waiting for approval.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {negotiations.map((negotiation) => (
              <Card key={negotiation.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {negotiation.player.firstName} {negotiation.player.lastName} ·{' '}
                      {negotiation.club.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {negotiation.offerAmount
                        ? `${(negotiation.offerAmount / 100).toLocaleString('en-GB')} ${
                            negotiation.currency
                          }`
                        : 'Contract offer'}
                    </p>
                    {negotiation.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{negotiation.notes}</p>
                    ) : null}
                  </div>
                  <DecisionButtons kind="negotiation" id={negotiation.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold tracking-tight">Recent decisions</h2>
        {recentTrials.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">No decisions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTrials.map((trial) => (
              <Card key={trial.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {trial.player.firstName} {trial.player.lastName} · {trial.club.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trial.parentDecisionAt
                        ? trial.parentDecisionAt.toLocaleDateString('en-GB')
                        : ''}
                    </p>
                  </div>
                  <Badge variant={trial.parentApproval === 'APPROVED' ? 'success' : 'default'}>
                    {trial.parentApproval === 'APPROVED' ? 'Approved' : 'Declined'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
