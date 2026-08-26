import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { CreateSubmissionForm } from '@/components/agent/create-submission-form';

export const metadata: Metadata = { title: 'New submission' };

export default async function AgentNewSubmissionPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const [players, clubs] = await Promise.all([
    prisma.agentPlayer.findMany({
      where: { agentId: agent.id, status: 'ACTIVE' },
      include: { player: true },
    }),
    prisma.club.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const playerOptions = players.map((entry) => ({
    value: entry.playerId,
    label: `${entry.player.firstName} ${entry.player.lastName}`,
  }));
  const clubOptions = clubs.map((club) => ({ value: club.id, label: club.name }));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/agent/submissions"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Submissions
      </Link>
      <h1 className="mb-6 text-2xl font-bold">New submission</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Selecciona un jugador representado y el club al que quieres enviarlo.
      </p>
      <CreateSubmissionForm players={playerOptions} clubs={clubOptions} />
    </div>
  );
}
