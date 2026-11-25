import Link from 'next/link';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/actions/notifications';
import {
  NOTIFICATION_GROUPS,
  NOTIFICATION_GROUP_LABELS,
  groupNotificationsByDay,
  notificationGroup,
} from '@/lib/notifications/feed';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  count: number;
  read: boolean;
  createdAt: Date;
}

function timeLabel(date: Date): string {
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function NotificationCard({ item }: { item: NotificationRow }) {
  return (
    <Card className={item.read ? 'opacity-70' : ''}>
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {item.title}
            {item.count > 1 ? ` ×${item.count}` : ''}
          </p>
          {item.message ? (
            <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {timeLabel(item.createdAt)} · {NOTIFICATION_GROUP_LABELS[notificationGroup(item.type)]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!item.read ? <Badge>New</Badge> : null}
          {item.link ? (
            <Link
              href={item.link}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:bg-muted"
            >
              Open
            </Link>
          ) : null}
          {!item.read ? (
            <form action={markNotificationReadAction}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                Mark read
              </button>
            </form>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Group({ title, items }: { title: string; items: NotificationRow[] }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

/**
 * Bandeja unificada: agrupa por Today/Earlier, permite filtrar por categoría y
 * marcar avisos como leídos. La comparten todas las áreas privadas.
 */
export async function NotificationsView({
  userId,
  basePath,
  settingsHref,
  filter,
  group,
}: {
  userId: string;
  basePath: string;
  settingsHref?: string;
  filter?: string;
  group?: string;
}) {
  const notifications: NotificationRow[] = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const unread = notifications.filter((item) => !item.read).length;
  const activeGroup =
    group && (NOTIFICATION_GROUPS.some((entry) => entry.id === group) || group === 'system')
      ? group
      : null;
  const onlyUnread = filter === 'unread';

  const visible = notifications.filter((item) => {
    if (onlyUnread && item.read) return false;
    if (activeGroup && notificationGroup(item.type) !== activeGroup) return false;
    return true;
  });

  const counts = new Map<string, number>();
  for (const item of notifications) {
    const key = notificationGroup(item.type);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const { today, earlier } = groupNotificationsByDay(visible);

  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-semibold ${
      active
        ? 'border-ink bg-ink text-white'
        : 'border-border text-muted-foreground hover:bg-muted'
    }`;

  function hrefFor(params: { filter?: string | null; group?: string | null }) {
    const search = new URLSearchParams();
    if (params.filter) search.set('filter', params.filter);
    if (params.group) search.set('group', params.group);
    const query = search.toString();
    return `${basePath}${query ? `?${query}` : ''}`;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {unread} unread of {notifications.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {settingsHref ? (
            <Link
              href={settingsHref}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              How you&apos;re notified
            </Link>
          ) : null}
          {unread > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                Mark all as read
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={hrefFor({ group: activeGroup })} className={pill(!onlyUnread)}>
          All
        </Link>
        <Link
          href={hrefFor({ filter: 'unread', group: activeGroup })}
          className={pill(onlyUnread)}
        >
          Unread
        </Link>
        {[...NOTIFICATION_GROUPS, { id: 'system' as const }].map((entry) => {
          const id = entry.id;
          return (
            <Link
              key={id}
              href={hrefFor({ filter: onlyUnread ? 'unread' : null, group: id })}
              className={pill(activeGroup === id)}
            >
              {NOTIFICATION_GROUP_LABELS[id]}{' '}
              <span className="opacity-60">{counts.get(id) ?? 0}</span>
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No notifications here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {today.length > 0 ? <Group title="Today" items={today} /> : null}
          {earlier.length > 0 ? <Group title="Earlier" items={earlier} /> : null}
        </div>
      )}
    </div>
  );
}
