import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { markNotificationsReadAction } from '@/app/actions/player';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Notificaciones' };

export default async function PlayerNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notificaciones" icon="bell">
        {unreadCount > 0 ? (
          <form action={markNotificationsReadAction}>
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              Mark all as read
            </button>
          </form>
        ) : null}
      </PageHeader>

      {notifications.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No tienes notificaciones.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const card = (
              <Card
                className={`transition-colors ${notification.read ? 'opacity-70' : ''} ${
                  notification.link ? 'group-hover:border-primary' : ''
                }`}
              >
                <CardContent className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{notification.title}</h2>
                    {notification.message ? (
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notification.createdAt.toLocaleString('en')}
                    </p>
                  </div>
                  {!notification.read ? <Badge>New</Badge> : null}
                </CardContent>
              </Card>
            );

            return notification.link ? (
              <Link key={notification.id} href={notification.link} className="group">
                {card}
              </Link>
            ) : (
              <div key={notification.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
