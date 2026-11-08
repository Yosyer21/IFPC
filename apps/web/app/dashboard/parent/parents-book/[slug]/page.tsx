import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getParentsBookDoc } from '@/lib/parents-book';

export const metadata: Metadata = { title: 'Parents Book' };

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp']);

export default async function ParentsBookDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getParentsBookDoc(slug);
  if (!doc) notFound();

  const isPdf = doc.ext === 'pdf';
  const isImage = IMAGE_EXTS.has(doc.ext);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/parent/parents-book"
        className="mb-4 inline-flex text-sm font-semibold text-[#4f6b0a] hover:underline"
      >
        ← Parents Book
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">{doc.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {doc.category}
            {doc.description ? ` · ${doc.description}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Open in new tab
          </a>
          <a
            href={doc.url}
            download
            className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-ink transition-colors hover:brightness-95"
          >
            Download
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isPdf ? (
          <iframe src={doc.url} title={doc.title} className="h-[78vh] w-full" />
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.url} alt={doc.title} className="max-h-[78vh] w-full object-contain" />
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            This file type can’t be previewed here. Use “Open in new tab”.
          </div>
        )}
      </div>
    </div>
  );
}
