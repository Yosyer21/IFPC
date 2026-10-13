import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'My documents' };

const TYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  contract: 'Contract',
  medical: 'Medical',
  other: 'Other',
};

export default async function PlayerDocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  });
  if (!player) notFound();

  const documents = player.documents;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My documents" icon="file">
        <Link
          href="/dashboard/player/documents/upload"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
        >
          Upload document
        </Link>
      </PageHeader>

      {documents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You have no documents uploaded yet. Your documents (passport, contract, medical
              certificate…) will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/dashboard/player/documents/${document.id}`}
              className="group"
            >
              <Card className="transition-colors group-hover:border-primary">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{document.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {document.createdAt.toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <Badge>{TYPE_LABELS[document.type] ?? document.type}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
