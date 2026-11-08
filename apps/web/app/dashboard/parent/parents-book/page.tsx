import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconBook, IconFile } from '@/components/dashboard/icons';
import { readParentsBookDocs } from '@/lib/parents-book';

export const metadata: Metadata = { title: 'Parents Book' };

/**
 * Parents Book: todos los documentos de la familia. Lee la carpeta
 * `apps/web/public/parents-book/` (helper en `lib/parents-book.ts`), así que
 * basta con soltar archivos ahí para que aparezcan aquí.
 */
export default async function ParentsBookPage() {
  const docs = await readParentsBookDocs();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Parents Book"
        subtitle="Every document for your family, in one place"
        icon="book"
      />

      {docs.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-12 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-[#4f6b0a]">
              <IconBook className="h-6 w-6" />
            </span>
            <p className="text-sm text-muted-foreground">
              The Parents Book is empty for now. Documents will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc, index) => (
            <Link
              key={doc.slug}
              href={`/dashboard/parent/parents-book/${doc.slug}`}
              className="animate-fade-up group block"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="card-hover h-full">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="fb-tag fb-tag-gray">{doc.category}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {doc.ext}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-[#4f6b0a]">
                      <IconFile className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-base font-bold leading-snug">{doc.title}</h2>
                      {doc.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="mt-auto text-sm font-semibold text-foreground group-hover:underline">
                    Open →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
