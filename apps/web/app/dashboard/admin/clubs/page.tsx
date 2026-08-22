import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { verifyClubAction } from '@/app/actions/admin';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Clubes' };

export default async function AdminClubsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const clubs = await prisma.club.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Clubes"
        subtitle="Clubes registrados y verificación de entidades"
        icon="briefcase"
      />

      {clubs.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay clubes registrados.</p>
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
                    {club.city ?? '—'}, {club.country} · {club.user?.email ?? 'sin usuario'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
