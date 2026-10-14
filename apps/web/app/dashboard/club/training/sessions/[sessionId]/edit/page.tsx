import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { TrainingSessionForm } from '@/components/training/session-form';
import { TrainingSessionItemsManager } from '@/components/training/session-items-manager';
import { TrainingRecipientsPanel } from '@/components/training/recipients-panel';
import { listAuthoredTraining, trainingPublishStateLabel } from '@/lib/training';
import { authorPlayers, sessionRecipients } from '@/lib/training-assignments';
import { findAuthoredTrainingSession } from '@/lib/training-sessions';

export const metadata: Metadata = { title: 'Edit session' };

const BASE = '/dashboard/club/training';

/**
 * Montaje de una sesión del club: sus ejercicios (añadir, quitar y ordenar) y sus
 * datos con la visibilidad. El aviso a los jugadores sale al publicarla.
 */
export default async function ClubTrainingSessionEditPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!club) notFound();

  const [trainingSession, content, audiencePlayers] = await Promise.all([
    findAuthoredTrainingSession({ clubId: club.id }, sessionId),
    listAuthoredTraining({ clubId: club.id }),
    authorPlayers({ coachId: null, clubId: club.id }),
  ]);
  if (!trainingSession) notFound();

  const recipients = await sessionRecipients(trainingSession);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Edit session</h1>
          <p className="text-sm text-muted-foreground">
            {trainingPublishStateLabel(trainingSession)}
          </p>
        </div>
        <Link href={BASE} className="text-sm text-muted-foreground hover:underline">
          ← Football Center
        </Link>
      </div>

      <div className="mb-6">
        <TrainingRecipientsPanel
          recipients={recipients}
          target={{ kind: 'session', id: trainingSession.id }}
          draft={trainingSession.status === 'DRAFT'}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4">
          <h2 className="font-semibold">Exercises in this session</h2>
          <TrainingSessionItemsManager session={trainingSession} available={content} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Details</h2>
          <TrainingSessionForm
            players={audiencePlayers}
            session={{
              id: trainingSession.id,
              title: trainingSession.title,
              description: trainingSession.description,
              weekday: trainingSession.weekday,
              status: trainingSession.status,
              publishAt: trainingSession.publishAt,
              scope: trainingSession.scope,
              targetPlayerIds: trainingSession.targetPlayerIds,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
