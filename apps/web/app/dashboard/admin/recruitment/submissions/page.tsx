import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'Envíos · Reclutamiento' };

export default async function AdminRecruitmentSubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const submissions = await prisma.submission.findMany({
    include: {
      player: true,
      club: true,
      agent: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const byStatus = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/recruitment"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Reclutamiento
      </Link>
      <PageHeader
        title="Envíos"
        subtitle={`${submissions.length} envíos de jugadores a clubes`}
        icon="briefcase"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(byStatus).map(([status, count]) => (
          <span key={status} className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-sm text-muted-foreground">{count}</span>
          </span>
        ))}
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay envíos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {submission.player.firstName} {submission.player.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → {submission.club.name}
                    {submission.agent ? ` · agente: ${submission.agent.user.name}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {submission.createdAt.toLocaleDateString('es')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={submission.stage} />
                  <StatusBadge status={submission.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
