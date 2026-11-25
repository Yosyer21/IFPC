import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import {
  DOCUMENT_FOLDERS,
  DOCUMENT_FOLDER_LABELS,
  DOCUMENT_TYPE_LABELS,
  documentExpiryStatus,
  isDocumentFolder,
} from '@/lib/documents';

export const metadata: Metadata = { title: 'My documents' };

export default async function PlayerDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { folder } = await searchParams;
  const activeFolder = folder && isDocumentFolder(folder) ? folder : null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  });
  if (!player) notFound();

  const now = new Date();
  const documents = player.documents;
  const filtered = activeFolder
    ? documents.filter((document) => document.folder === activeFolder)
    : documents;
  const alerts = documents.filter((document) => {
    const status = documentExpiryStatus(document.expiresAt, now);
    return status.state === 'expiring' || status.state === 'expired';
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="My documents" icon="file">
        <Link
          href="/dashboard/player/documents/upload"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
        >
          Upload document
        </Link>
      </PageHeader>

      {alerts.length > 0 ? (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardContent>
            <h2 className="mb-1 font-semibold text-amber-800">Expiring or expired</h2>
            <ul className="flex flex-col gap-1 text-sm text-amber-800">
              {alerts.map((document) => {
                const status = documentExpiryStatus(document.expiresAt, now);
                return (
                  <li key={document.id}>
                    {document.title} —{' '}
                    {status.state === 'expired'
                      ? 'expired'
                      : `expires in ${status.days} day(s)`}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/player/documents"
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
            !activeFolder
              ? 'border-ink bg-ink text-white'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          All
        </Link>
        {DOCUMENT_FOLDERS.map((value) => (
          <Link
            key={value}
            href={`/dashboard/player/documents?folder=${value}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              activeFolder === value
                ? 'border-ink bg-ink text-white'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {DOCUMENT_FOLDER_LABELS[value]}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No documents in this folder yet. Upload one to keep it organised.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((document) => {
            const status = documentExpiryStatus(document.expiresAt, now);
            const folderLabel =
              (DOCUMENT_FOLDER_LABELS as Record<string, string>)[document.folder] ??
              document.folder;
            return (
              <Link
                key={document.id}
                href={`/dashboard/player/documents/${document.id}`}
                className="group"
              >
                <Card className="transition-colors group-hover:border-primary">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{document.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {folderLabel} · {document.createdAt.toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{DOCUMENT_TYPE_LABELS[document.type] ?? document.type}</Badge>
                      {status.state === 'expired' ? (
                        <Badge variant="warning">Expired</Badge>
                      ) : status.state === 'expiring' ? (
                        <Badge variant="warning">Expires in {status.days}d</Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
