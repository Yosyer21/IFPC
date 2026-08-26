import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { IconFile, IconShield, IconUser } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Documentos' };

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Pasaporte',
  contract: 'Contrato',
  medical: 'Medical',
  other: 'Otro',
};

export default async function AdminDocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const documents = await prisma.document.findMany({
    include: { player: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const players = new Set(documents.map((doc) => doc.playerId)).size;
  const contracts = documents.filter((doc) => doc.type === 'contract').length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Documentos"
        subtitle="Documents uploaded by players (passports, contracts, medical…)"
        icon="file"
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard href="/dashboard/admin/documents" icon={IconFile} label="Documentos" value={documents.length} />
        <StatCard href="/dashboard/admin/documents" icon={IconUser} label="Jugadores" value={players} />
        <StatCard href="/dashboard/admin/documents" icon={IconShield} label="Contratos" value={contracts} />
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/admin/documents/${document.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {document.title}
                </Link>
                <div className="mt-1 text-xs text-muted-foreground">
                  {document.player.firstName} {document.player.lastName} ·{' '}
                  {document.createdAt.toLocaleDateString('es')}
                </div>
              </div>
              <Badge variant="outline">
                {DOCUMENT_TYPE_LABELS[document.type] ?? document.type}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


