import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Reclutamiento' };

export default async function AdminRecruitmentPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [submissions, trials, negotiations, contracts] = await Promise.all([
    prisma.submission.findMany({
      include: { player: true, club: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.trial.findMany({ include: { player: true, club: true }, take: 20 }),
    prisma.negotiation.findMany({ include: { player: true, club: true }, take: 20 }),
    prisma.contract.findMany({ include: { player: true, club: true }, take: 20 }),
  ]);

  const sections = [
    { title: 'Envíos', items: submissions, href: '/dashboard/admin/recruitment/submissions' },
    { title: 'Pruebas', items: trials, href: '/dashboard/admin/recruitment/trials' },
    { title: 'Negociaciones', items: negotiations, href: '/dashboard/admin/recruitment/negotiations' },
    { title: 'Contratos', items: contracts, href: '/dashboard/admin/recruitment/contracts' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Reclutamiento"
        subtitle="Flujo global de envíos, pruebas, negociaciones y contratos"
        icon="briefcase"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{section.title}</h2>
                <Badge>{section.items.length}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {section.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin registros.</p>
                ) : (
                  section.items.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-md border border-border p-2 text-sm">
                      <span className="font-medium">
                        {item.player?.firstName ?? 'Jugador'} {item.player?.lastName ?? ''}
                      </span>
                      <span className="text-muted-foreground"> → {item.club?.name ?? 'Club'}</span>
                    </div>
                  ))
                )}
              </div>
              <Link href={section.href} className="mt-3 inline-block text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
