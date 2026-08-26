import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'Pruebas · Reclutamiento' };

export default async function AdminRecruitmentTrialsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const trials = await prisma.trial.findMany({
    include: { player: true, club: true },
    orderBy: { startsAt: 'desc' },
    take: 200,
  });

  const upcoming = trials.filter((t) => t.startsAt > new Date()).length;
  const completed = trials.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/recruitment"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Recruitment
      </Link>
      <PageHeader
        title="Pruebas"
        subtitle={`${trials.length} pruebas registradas`}
        icon="briefcase"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline">{upcoming} upcoming</Badge>
        <Badge variant="outline">{completed} completadas</Badge>
      </div>

      {trials.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay pruebas registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {trials.map((trial) => (
            <Card key={trial.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {trial.player.firstName} {trial.player.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → {trial.club.name} · {trial.location ?? 'No location'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trial.startsAt.toLocaleDateString('es')}
                    {trial.endsAt ? ` — ${trial.endsAt.toLocaleDateString('es')}` : ''}
                  </p>
                </div>
                <StatusBadge status={trial.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
