import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { verifyClubAction } from '@/app/actions/admin';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Clubes pendientes' };

export default async function AdminClubsPendingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const clubs = await prisma.club.findMany({
    where: { verified: false },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/clubs"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← All clubs
      </Link>
      <PageHeader
        title="Clubes pendientes"
        subtitle="Entities awaiting admin verification"
        icon="briefcase"
      />

      {clubs.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No clubs pending verification.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {clubs.map((club) => (
            <Card key={club.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{club.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {club.email} · {club.city ?? '—'}, {club.country}
                  </p>
                  {club.description ? (
                    <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                      {club.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Pendiente</Badge>
                  <form action={verifyClubAction}>
                    <input type="hidden" name="clubId" value={club.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      Verificar
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
