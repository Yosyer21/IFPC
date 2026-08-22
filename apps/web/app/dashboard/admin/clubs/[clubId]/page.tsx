import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { verifyClubAction } from '@/app/actions/admin';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'Detalle del club' };

export default async function AdminClubDetailPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      user: true,
      opportunities: { orderBy: { createdAt: 'desc' }, take: 20 },
      requirements: { orderBy: { createdAt: 'desc' }, take: 20 },
      staff: { include: { user: true } },
      _count: {
        select: { submissions: true, trials: true, negotiations: true, contracts: true, inquiries: true },
      },
    },
  });
  if (!club) notFound();

  const info: [string, string][] = [
    ['Email', club.email],
    ['País', club.country],
    ['Ciudad', club.city ?? '—'],
    ['Liga', club.league ?? '—'],
    ['Usuario', club.user?.name ?? 'Sin usuario vinculado'],
    ['Registrado el', club.createdAt.toLocaleDateString('es')],
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/clubs"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Clubes
      </Link>
      <PageHeader title={club.name} subtitle={club.user?.email ?? club.email} icon="briefcase">
        <Badge variant={club.verified ? 'success' : 'warning'}>
          {club.verified ? 'Verificado' : 'Pendiente'}
        </Badge>
        {!club.verified ? (
          <form action={verifyClubAction}>
            <input type="hidden" name="clubId" value={club.id} />
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Verificar
            </button>
          </form>
        ) : null}
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ['Envíos', club._count.submissions],
          ['Pruebas', club._count.trials],
          ['Negociaciones', club._count.negotiations],
          ['Contratos', club._count.contracts],
          ['Consultas', club._count.inquiries],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="text-center">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Información</h2>
            <dl className="flex flex-col gap-2 text-sm">
              {info.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {club.description ? (
              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                {club.description}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Staff ({club.staff.length})</h2>
            {club.staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin miembros de staff.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {club.staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <span className="font-medium">{member.user.name}</span>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Oportunidades ({club.opportunities.length})</h2>
            {club.opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin oportunidades publicadas.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {club.opportunities.slice(0, 10).map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{opportunity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                          opportunity.type
                        ] ?? opportunity.type}
                      </p>
                    </div>
                    <StatusBadge status={opportunity.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Requisitos ({club.requirements.length})</h2>
            {club.requirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin requisitos de reclutamiento.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {club.requirements.slice(0, 10).map((requirement) => (
                  <div
                    key={requirement.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{requirement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {requirement.position ?? 'Cualquier posición'} · {requirement.country ?? '—'}
                      </p>
                    </div>
                    <StatusBadge status={requirement.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
