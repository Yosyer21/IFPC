import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Mi ruta de desarrollo' };

export default async function PlayerPathwayPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { pathway: true },
  });
  if (!player) notFound();

  const pathway = player.pathway;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Mi ruta de desarrollo</h1>

      {!pathway ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no tienes una ruta asignada. Tu entrenador o la plataforma podrán asignarte un
              plan de desarrollo personalizado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle>{pathway.title}</CardTitle>
            <Badge variant={pathway.status === 'active' ? 'success' : 'default'}>
              {pathway.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {pathway.level ? (
              <p className="text-sm text-muted-foreground">Nivel: {pathway.level}</p>
            ) : null}
            {pathway.description ? (
              <p className="text-sm text-muted-foreground">{pathway.description}</p>
            ) : null}
            {pathway.focus ? (
              <div>
                <h2 className="mb-1 text-sm font-semibold">Áreas de enfoque</h2>
                <p className="text-sm text-muted-foreground">{pathway.focus}</p>
              </div>
            ) : null}
            {pathway.goals ? (
              <div>
                <h2 className="mb-1 text-sm font-semibold">Objetivos</h2>
                <p className="text-sm text-muted-foreground">{pathway.goals}</p>
              </div>
            ) : null}
            <Link
              href={`/dashboard/player/pathway/${pathway.id}`}
              className="mt-2 inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Ver detalle
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
