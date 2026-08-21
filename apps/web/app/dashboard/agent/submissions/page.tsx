import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Envíos' };

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
      <PageHeader title="Envíos" subtitle="Jugadores presentados a clubes y su estado" icon="mail">
        <Link
          href="/dashboard/agent/submissions/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
        >
          Nuevo envío
        </Link>
      </PageHeader>

      {submissions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no has enviado jugadores a clubes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((submission) => (
            <Link
              key={submission.id}
              href={`/dashboard/agent/submissions/${submission.id}`}
              className="group"
            >
              <Card className="transition-colors group-hover:border-primary">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">
                      {submission.player.firstName} {submission.player.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {submission.club.name} · Enviado el{' '}
                      {submission.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="warning">{submission.status}</Badge>
                    <span className="text-xs text-muted-foreground">{submission.stage}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
