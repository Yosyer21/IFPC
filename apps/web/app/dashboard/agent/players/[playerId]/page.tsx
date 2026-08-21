import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { POSITION_LABELS } from '@future-buller/config';

export const metadata: Metadata = { title: 'Jugador' };

export default async function AgentPlayerDetailPage({
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

  const sections = [
    { href: `/dashboard/agent/players/${playerId}/profile`, label: 'Perfil' },
    { href: `/dashboard/agent/players/${playerId}/videos`, label: 'Vídeos' },
    { href: `/dashboard/agent/players/${playerId}/evaluations`, label: 'Evaluaciones' },
    { href: `/dashboard/agent/players/${playerId}/documents`, label: 'Documentos' },
  ];

  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : '—';

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/agent/players"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Mis jugadores
      </Link>
      <h1 className="mb-4 text-2xl font-bold">
        {player.firstName} {player.lastName}
      </h1>
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="success">{player.status}</Badge>
        <span className="text-sm text-muted-foreground">{player.user.email}</span>
      </div>

      <Card className="mb-4">
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Posición', positionLabel],
              ['Nacionalidad', player.nationality ?? '—'],
              ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
              ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            <Card className="transition-colors group-hover:border-primary">
              <CardContent className="text-center">
                <div className="font-medium">{section.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
