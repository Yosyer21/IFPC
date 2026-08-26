import type { Metadata } from 'next';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconFile } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Documentos' };

export default function AgentDocumentsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Documentos"
        subtitle="Contracts, licenses and documentation of your represented players"
        icon="file"
      />
      <Card className="animate-fade-up">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconFile className="h-7 w-7" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your represented players' documents (contracts, licenses, passports) will appear here
            in an upcoming phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

