import type { Metadata } from 'next';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconMail } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Comunicaciones' };

export default function AgentCommunicationsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Comunicaciones"
        subtitle="Mensajes con clubes y jugadores representados"
        icon="mail"
      />
      <Card className="animate-fade-up">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconMail className="h-7 w-7" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            La mensajería entre agentes y clubes se habilitará en una próxima fase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

