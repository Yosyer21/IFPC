import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Documento' };

const TYPE_LABELS: Record<string, string> = {
  passport: 'Pasaporte',
  contract: 'Contrato',
  medical: 'Médico',
  other: 'Otro',
};

export default async function PlayerDocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const document = await prisma.document.findFirst({
    where: { id: documentId, playerId: player.id },
  });
  if (!document) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/documents"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Mis documentos
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{document.title}</h1>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Badge>{TYPE_LABELS[document.type] ?? document.type}</Badge>
            <span className="text-sm text-muted-foreground">
              Subido el {document.createdAt.toLocaleDateString('es')}
            </span>
          </div>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Abrir documento
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
