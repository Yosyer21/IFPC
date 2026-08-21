import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'Contratos · Reclutamiento' };

export default async function AdminRecruitmentContractsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contracts = await prisma.contract.findMany({
    include: { player: true, club: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const active = contracts.filter((c) => c.status === 'ACTIVE').length;
  const signed = contracts.filter((c) => c.status === 'SIGNED').length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/recruitment"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Reclutamiento
      </Link>
      <PageHeader
        title="Contratos"
        subtitle={`${contracts.length} contratos registrados`}
        icon="briefcase"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline">{active} activos</Badge>
        <Badge variant="outline">{signed} firmados</Badge>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay contratos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {contract.player.firstName} {contract.player.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">→ {contract.club.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.startsAt.toLocaleDateString('es')}
                    {contract.endsAt ? ` — ${contract.endsAt.toLocaleDateString('es')}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {contract.salary ? (
                    <Badge variant="success">
                      {(contract.salary / 100).toLocaleString('es')} {contract.currency}
                    </Badge>
                  ) : null}
                  <StatusBadge status={contract.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
