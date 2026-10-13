import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { TrainingSessionCard } from '@/components/training/session-card';
import { findPlayerTrainingSession } from '@/lib/training-sessions';

export const metadata: Metadata = { title: 'Training session' };

/**
 * Detalle de una sesión visible para el jugador: sus ejercicios en orden, la carga
 * total y lo que ya lleva hecho. Es el destino del aviso de sesión publicada.
 */
export default async function PlayerTrainingSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const trainingSession = await findPlayerTrainingSession(session.user.id, sessionId);
  if (!trainingSession) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/training"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Football Center
      </Link>
      <TrainingSessionCard session={trainingSession} showProgress />
    </div>
  );
}
