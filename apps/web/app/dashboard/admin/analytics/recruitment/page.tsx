import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { IconBriefcase, IconTarget, IconUsers } from '@/components/dashboard/icons';
import { monthlyCounts } from '@/components/admin/analytics-utils';

export const metadata: Metadata = { title: 'Analytics · Reclutamiento' };

export default async function AdminAnalyticsRecruitmentPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [submissions, trials, negotiations, contracts] = await Promise.all([
    prisma.submission.findMany({ select: { createdAt: true, status: true } }),
    prisma.trial.findMany({ select: { createdAt: true, status: true } }),
    prisma.negotiation.findMany({ select: { createdAt: true, status: true } }),
    prisma.contract.findMany({ select: { createdAt: true, status: true } }),
  ]);

  const pipeline = [
    { label: 'Envíos', value: submissions.length },
    { label: 'Pruebas', value: trials.length },
    { label: 'Negociaciones', value: negotiations.length },
    { label: 'Contratos', value: contracts.length },
  ];

  const conversion = (from: number, to: number) =>
    from > 0 ? Math.round((to / from) * 100) : 0;

  const acceptedSubmissions = submissions.filter((s) => s.status === 'ACCEPTED').length;
  const acceptedNegotiations = negotiations.filter((n) => n.status === 'ACCEPTED').length;
  const signedContracts = contracts.filter((c) => c.status === 'SIGNED').length;

  const monthly = monthlyCounts(
    [
      ...submissions.map((s) => ({ createdAt: s.createdAt })),
      ...trials.map((t) => ({ createdAt: t.createdAt })),
    ],
    6
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analytics de reclutamiento"
        subtitle="Embudo del pipeline y conversión entre etapas"
        icon="trending"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="/dashboard/admin/recruitment" icon={IconUsers} label="Envíos" value={submissions.length} />
        <StatCard href="/dashboard/admin/recruitment" icon={IconTarget} label="Pruebas" value={trials.length} />
        <StatCard href="/dashboard/admin/recruitment" icon={IconBriefcase} label="Negociaciones" value={negotiations.length} />
        <StatCard href="/dashboard/admin/recruitment" icon={IconBriefcase} label="Contratos" value={contracts.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Pipeline</h2>
            <CountsBars items={pipeline} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Conversión entre etapas</h2>
            <div className="flex flex-col gap-4">
              {[
                ['Envíos → Pruebas', conversion(submissions.length, trials.length)],
                ['Pruebas → Negociaciones', conversion(trials.length, negotiations.length)],
                ['Negociaciones → Contratos', conversion(negotiations.length, contracts.length)],
                ['Envíos aceptados', conversion(submissions.length, acceptedSubmissions)],
                ['Negociaciones aceptadas', conversion(negotiations.length, acceptedNegotiations)],
                ['Contratos firmados', conversion(contracts.length, signedContracts)],
              ].map(([label, percent]) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold tabular-nums">{percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="fb-bar h-full rounded-full bg-gradient-to-r from-emerald-700 to-primary"
                      style={{ '--bar-target': `${percent}%` } as CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent>
          <h2 className="mb-4 font-semibold">Actividad (envíos + pruebas) por mes</h2>
          <CountsBars items={monthly} />
        </CardContent>
      </Card>
    </div>
  );
}
