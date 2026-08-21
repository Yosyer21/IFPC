import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Requisitos' };

export default async function ClubRequirementsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const requirements = await prisma.requirement.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Requisitos del club" icon="file">
        <Link
          href="/dashboard/club/requirements/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
        >
          Nuevo requisito
        </Link>
      </PageHeader>

      {requirements.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define qué perfiles de jugador busca tu club.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requirements.map((requirement) => (
            <Link
              key={requirement.id}
              href={`/dashboard/club/requirements/${requirement.id}`}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-primary">
                <CardContent className="flex flex-col gap-2">
                  <Badge variant={requirement.status === 'OPEN' ? 'success' : 'default'}>
                    {requirement.status}
                  </Badge>
                  <h2 className="font-semibold">{requirement.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {requirement.position ? `Posición: ${requirement.position}` : 'Cualquier posición'}
                    {requirement.ageMin || requirement.ageMax
                      ? ` · ${requirement.ageMin ?? '?'}–${requirement.ageMax ?? '?'} años`
                      : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
