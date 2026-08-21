import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Envío' };

const STAGES = ['SUBMISSION', 'TRIAL', 'NEGOTIATION', 'CONTRACT'];

export default async function AgentSubmissionDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, agentId: agent.id },
    include: {
      player: true,
      club: true,
      trial: true,
      negotiation: true,
      contract: true,
    },
  });
  if (!submission) notFound();

  const currentStageIndex = STAGES.indexOf(submission.stage);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/agent/submissions"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Envíos
      </Link>
      <h1 className="mb-4 text-2xl font-bold">
        {submission.player.firstName} {submission.player.lastName} → {submission.club.name}
      </h1>

      <div className="mb-4 flex items-center gap-2">
        <Badge variant="warning">{submission.status}</Badge>
        <span className="text-sm text-muted-foreground">
          {submission.createdAt.toLocaleDateString('es')}
        </span>
      </div>

      {/* Pipeline de etapas */}
      <Card className="mb-4">
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {STAGES.map((stage, index) => (
              <div key={stage} className="flex items-center gap-2">
                <Badge
                  variant={
                    index < currentStageIndex
                      ? 'success'
                      : index === currentStageIndex
                        ? 'warning'
                        : 'default'
                  }
                >
                  {stage}
                </Badge>
                {index < STAGES.length - 1 ? <span className="text-muted-foreground">→</span> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {submission.notes ? (
        <Card className="mb-4">
          <CardContent>
            <h2 className="mb-2 font-semibold">Notas</h2>
            <p className="text-sm text-muted-foreground">{submission.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {submission.trial ? (
          <Link href={`/dashboard/agent/trials/${submission.trial.id}`} className="group">
            <Card className="transition-colors group-hover:border-primary">
              <CardContent className="flex items-center justify-between">
                <span className="font-medium">Prueba</span>
                <span className="text-sm text-muted-foreground">
                  {submission.trial.startsAt.toLocaleDateString('es')} · {submission.trial.status}
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : null}
        {submission.negotiation ? (
          <Link href={`/dashboard/agent/negotiations/${submission.negotiation.id}`} className="group">
            <Card className="transition-colors group-hover:border-primary">
              <CardContent className="flex items-center justify-between">
                <span className="font-medium">Negociación</span>
                <span className="text-sm text-muted-foreground">
                  {submission.negotiation.status}
                  {submission.negotiation.offerAmount
                    ? ` · ${submission.negotiation.offerAmount} ${submission.negotiation.currency}`
                    : ''}
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : null}
        {submission.contract ? (
          <Link href={`/dashboard/agent/contracts/${submission.contract.id}`} className="group">
            <Card className="transition-colors group-hover:border-primary">
              <CardContent className="flex items-center justify-between">
                <span className="font-medium">Contrato</span>
                <span className="text-sm text-muted-foreground">{submission.contract.status}</span>
              </CardContent>
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
