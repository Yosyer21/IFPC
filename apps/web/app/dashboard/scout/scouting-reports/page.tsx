import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { CreateScoutingReportForm } from '@/components/scout/create-scouting-report-form';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Informes de scouting' };

export default async function ScoutReportsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const scout = await prisma.scout.findUnique({ where: { userId: session.user.id } });
  if (!scout) notFound();

  const [reports, players] = await Promise.all([
    prisma.scoutingReport.findMany({
      where: { scoutId: scout.id },
      include: { player: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.player.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
  ]);

  const playerOptions = players.map((player) => ({
    value: player.id,
    label: `${player.firstName} ${player.lastName}${player.position ? ` (${player.position})` : ''}`,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Informes de scouting"
        subtitle="Documenta y valora el talento que encuentras"
        icon="whistle"
      />

      <h2 className="mb-3 text-lg font-semibold">New report</h2>
      <CreateScoutingReportForm players={playerOptions} />

      <h2 className="mb-3 mt-8 text-lg font-semibold">Created</h2>
      {reports.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">You haven't created any reports yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {report.player.firstName} {report.player.lastName}
                  </h3>
                  {report.strengths ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <strong>Fortalezas:</strong> {report.strengths}
                    </p>
                  ) : null}
                  {report.weaknesses ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <strong>A mejorar:</strong> {report.weaknesses}
                    </p>
                  ) : null}
                  {report.notes ? (
                    <p className="mt-1 text-sm text-muted-foreground">{report.notes}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {report.createdAt.toLocaleDateString('es')}
                  </p>
                </div>
                <Badge variant="success">{report.rating}/10</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
