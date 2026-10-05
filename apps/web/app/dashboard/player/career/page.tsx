import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { CareerForm } from '@/components/player/career-form';
import { removeCareerEntryAction } from '@/app/actions/player';

export const metadata: Metadata = { title: 'Trayectoria' };

export default async function PlayerCareerPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { career: { orderBy: [{ isCurrent: 'desc' }, { season: 'desc' }] } },
  });
  if (!player) notFound();

  const entries = player.career;
  const totals = entries.reduce(
    (acc, entry) => ({
      appearances: acc.appearances + entry.appearances,
      goals: acc.goals + entry.goals,
      assists: acc.assists + entry.assists,
    }),
    { appearances: 0, goals: 0, assists: 0 }
  );

  const summary = [
    { label: 'Temporadas', value: entries.length },
    { label: 'Partidos', value: totals.appearances },
    { label: 'Goles', value: totals.goals },
    { label: 'Asistencias', value: totals.assists },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Trayectoria"
        subtitle="Your club and season history: clubs, categories and stats"
        icon="trophy"
      />

      {entries.length > 0 ? (
        <Card className="animate-fade-up mb-4">
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {summary.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6 flex flex-col gap-3">
        {entries.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Todavía no has añadido tu trayectoria. Clubes y ojeadores la ven en tu perfil
                público, así que mantenerla al día ayuda a que te encuentren.
              </p>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="animate-fade-up">
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold">
                      {entry.clubName}
                      {entry.category ? (
                        <span className="text-muted-foreground"> · {entry.category}</span>
                      ) : null}
                    </h2>
                    <p className="text-xs text-muted-foreground">Temporada {entry.season}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.isCurrent ? <Badge variant="success">Equipo actual</Badge> : null}
                    <form action={removeCareerEntryAction}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button
                        type="submit"
                        className="text-xs text-destructive hover:underline"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{entry.appearances} partidos</span>
                  <span>{entry.goals} goles</span>
                  <span>{entry.assists} asistencias</span>
                </div>

                {entry.notes ? (
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                ) : null}

                <details>
                  <summary className="cursor-pointer text-sm text-primary">Editar</summary>
                  <div className="mt-3">
                    <CareerForm entry={entry} />
                  </div>
                </details>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="animate-fade-up">
        <CardContent>
          <h2 className="mb-4 font-semibold">Añadir temporada</h2>
          <CareerForm />
        </CardContent>
      </Card>
    </div>
  );
}
