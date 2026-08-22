import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { markNotificationsReadAction } from '@/app/actions/player';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Notificaciones' };

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Notificaciones" icon="bell">
        <form action={markNotificationsReadAction}>
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            Marcar todas como leídas
          </button>
        </form>
      </PageHeader>

      {notifications.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay notificaciones.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{notification.title}</p>
                  {notification.message ? (
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notification.createdAt.toLocaleString('es')}
                  </p>
                </div>
                {!notification.read ? <Badge>Nuevo</Badge> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
