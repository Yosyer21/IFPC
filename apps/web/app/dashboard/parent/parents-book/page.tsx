import type { Metadata } from 'next';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconBook } from '@/components/dashboard/icons';
import { ParentsBookExplorer } from '@/components/parent/parents-book-explorer';
import { readParentsBookDocs } from '@/lib/parents-book';

export const metadata: Metadata = { title: 'Parents Book' };

/**
 * Parents Book: todos los documentos de la familia. Lee la carpeta
 * `apps/web/public/parents-book/` (helper en `lib/parents-book.ts`), así que
 * basta con soltar archivos ahí para que aparezcan. La lista (buscador +
 * filtros + animaciones) vive en el componente cliente `ParentsBookExplorer`.
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
        <ParentsBookExplorer docs={docs} />
      )}
    </div>
  );
}

