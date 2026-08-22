import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { matchScore } from '@ifpc/matching';
import { Badge, Card, CardContent, Progress } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Matching' };

export default async function ClubMatchingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const requirements = await prisma.requirement.findMany({
    where: { clubId: club.id, status: 'OPEN' },
  });

  const players = await prisma.player.findMany({
    where: { status: 'AVAILABLE' },
    include: { user: true },
    take: 50,
  });

  // Motor de matching real: mejor score de cada jugador contra los requisitos del club.
  const matches = players
    .map((player) => {
      const best = requirements
        .map((requirement) => ({
          requirementId: requirement.id,
          requirementTitle: requirement.title,
          ...matchScore(
            {
              position: player.position,
              dateOfBirth: player.dateOfBirth,
              nationality: player.nationality,
              competitionLevel: player.competitionLevel,
              status: player.status,
            },
            {
              position: requirement.position,
              ageMin: requirement.ageMin,
              ageMax: requirement.ageMax,
              level: requirement.level,
              country: requirement.country,
            }
          ),
        }))
        .sort((a, b) => b.total - a.total)[0] ?? null;
      return { player, best };
    })
    .filter((entry) => entry.best !== null)
    .sort((a, b) => (b.best?.total ?? 0) - (a.best?.total ?? 0));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Matching"
        subtitle="Jugadores disponibles ordenados por compatibilidad con tus requisitos (motor de matching)"
        icon="target"
      />

      {requirements.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Crea requisitos para recibir sugerencias de jugadores.{' '}
              <Link href="/dashboard/club/requirements/new" className="text-primary hover:underline">
                Crear requisito
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay coincidencias con tus requisitos en este momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map(({ player, best }) => (
            <Card key={player.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/dashboard/club/players/${player.id}`}
                    className="font-semibold hover:underline"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                  <div className="flex items-center gap-3">
                    <Badge variant="success">
                      {player.position
                        ? ((POSITION_LABELS as Record<string, string | undefined>)[
                            player.position
                          ] ?? player.position)
                        : 'Sin posición'}
                    </Badge>
                    <Badge variant="warning">{best?.total}/100</Badge>
                  </div>
                </div>
                <div>
                  <Progress value={best?.total ?? 0} />
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {best?.summary} · Mejor ajuste: <strong>{best?.requirementTitle}</strong>
                  </span>
                  <Link href={`/dashboard/club/players/${player.id}`} className="text-primary hover:underline">
                    Ver ficha →
                  </Link>
                </div>
                {best ? (
                  <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer text-xs">Desglose del score</summary>
                    <ul className="mt-2 flex flex-col gap-1">
                      {best.criteria.map((criterion) => (
                        <li key={criterion.key} className="flex items-center justify-between gap-3">
                          <span>
                            {criterion.label}: {criterion.detail}
                          </span>
                          <span className="font-medium">
                            {criterion.score}/{criterion.max}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
