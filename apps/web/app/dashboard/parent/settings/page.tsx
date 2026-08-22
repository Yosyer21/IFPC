import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Ajustes' };

export default async function ParentSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Ajustes"
        subtitle="Información de tu cuenta familiar"
        icon="settings"
      />

      <Card className="animate-fade-up">
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">Nombre</dt>
              <dd className="mt-1 font-medium">{user.name}</dd>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-1 font-medium">{user.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
