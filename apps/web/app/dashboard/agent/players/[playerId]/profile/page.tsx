import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';

export const metadata: Metadata = { title: 'Perfil del jugador' };

export default async function AgentPlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();
  const representation = await prisma.agentPlayer.findUnique({
    where: { agentId_playerId: { agentId: agent.id, playerId } },
  });
  if (!representation) notFound();

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { user: true },
  });
  if (!player) notFound();

  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/agent/players/${playerId}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Jugador
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Perfil</h1>
      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Nombre', `${player.firstName} ${player.lastName}`],
              ['Email', player.user.email],
              ['Posición', positionLabel],
              ['Nacionalidad', player.nationality ?? '—'],
              ['Pierna hábil', player.foot ?? '—'],
              ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
              ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
              ['Club actual', player.clubName ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
