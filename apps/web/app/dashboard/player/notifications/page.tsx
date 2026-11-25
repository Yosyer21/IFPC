import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { NotificationsView } from '@/components/notifications/notifications-view';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Notifications' };

export default async function PlayerNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; group?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { filter, group } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Notifications" icon="bell" />
      <NotificationsView
        userId={session.user.id}
        basePath="/dashboard/player/notifications"
        settingsHref="/dashboard/player/settings/notifications"
        filter={filter}
        group={group}
      />
    </div>
  );
}
