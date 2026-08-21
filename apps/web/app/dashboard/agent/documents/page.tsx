import type { Metadata } from 'next';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconFile } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Documentos' };

export default function AgentDocumentsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Documentos"
        subtitle="Contratos, licencias y documentación de tus representados"
        icon="file"
      />
      <Card className="animate-fade-up">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconFile className="h-7 w-7" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            Los documentos de tus representados (contratos, licencias, pasaportes) aparecerán aquí
            en una próxima fase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

