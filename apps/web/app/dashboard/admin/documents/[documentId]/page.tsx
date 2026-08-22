import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Documento' };

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Pasaporte',
  contract: 'Contrato',
  medical: 'Médico',
  other: 'Otro',
};

export default async function AdminDocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { player: { include: { user: true } } },
  });
  if (!document) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={document.title}
        subtitle={`${document.player.firstName} ${document.player.lastName}`}
        icon="file"
      >
        <Link href="/dashboard/admin/documents" className="text-sm text-muted-foreground hover:underline">
          ← Documentos
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">Tipo</dt>
              <dd className="mt-1 font-medium">
                {DOCUMENT_TYPE_LABELS[document.type] ?? document.type}
              </dd>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">Subido el</dt>
              <dd className="mt-1 font-medium">{document.createdAt.toLocaleDateString('es')}</dd>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">Jugador</dt>
              <dd className="mt-1 font-medium">
                {document.player.firstName} {document.player.lastName}
              </dd>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">Posición</dt>
              <dd className="mt-1 font-medium">{document.player.position ?? '—'}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={document.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Abrir documento
            </a>
            <Badge variant="outline">{document.url}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


