import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Documentos del jugador' };

const TYPE_LABELS: Record<string, string> = {
  passport: 'Pasaporte',
  contract: 'Contrato',
  medical: 'Médico',
  other: 'Otro',
};

export default async function AgentPlayerDocumentsPage({
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

  const documents = await prisma.document.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/agent/players/${playerId}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Jugador
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Documentos</h1>

      {documents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay documentos subidos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <h2 className="font-medium">{document.title}</h2>
                <div className="flex items-center gap-3">
                  <Badge>{TYPE_LABELS[document.type] ?? document.type}</Badge>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Abrir
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
