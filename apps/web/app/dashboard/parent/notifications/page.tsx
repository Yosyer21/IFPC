import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { NotificationsView } from '@/components/notifications/notifications-view';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Notifications · Parent' };

export default async function ParentNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; group?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { filter, group } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Notifications"
        subtitle="Everything that needs your attention."
        icon="bell"
      />
      <NotificationsView
        userId={session.user.id}
        basePath="/dashboard/parent/notifications"
        settingsHref="/dashboard/parent/settings"
        filter={filter}
        group={group}
      />
    </div>
  );
}
