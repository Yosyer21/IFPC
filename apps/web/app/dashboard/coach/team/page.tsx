import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { MatchForm } from '@/components/coach/match-form';
import { TrainingEventForm } from '@/components/coach/training-event-form';

export const metadata: Metadata = { title: 'Team calendar' };

export default async function CoachTeamPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return null;

  const [matches, trainings] = await Promise.all([
    prisma.match.findMany({
      where: { coachId: coach.id },
      orderBy: { startsAt: 'asc' },
      take: 50,
    }),
    prisma.trainingEvent.findMany({
      where: { coachId: coach.id },
      orderBy: { startsAt: 'asc' },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Team calendar"
        subtitle="Add dated training sessions and matches. They appear automatically in the unified calendar."
        icon="calendar"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Add training</h2>
            <TrainingEventForm />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Add match</h2>
            <MatchForm />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Training
          </h2>
          {trainings.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">No training events yet.</p>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {trainings.map((training) => (
                <li key={training.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                  <p className="font-medium">{training.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {training.startsAt.toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {training.durationMinutes} min
                    {training.location ? ` · ${training.location}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Matches
          </h2>
          {matches.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">No matches yet.</p>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {matches.map((match) => (
                <li key={match.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                  <p className="font-medium">
                    {match.home ? 'vs' : '@'} {match.opponent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {match.startsAt.toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {match.venue ? ` · ${match.venue}` : ''}
                    {match.ourScore != null && match.opponentScore != null
                      ? ` · ${match.ourScore}-${match.opponentScore}`
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
