import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { NotificationsView } from '@/components/notifications/notifications-view';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Notifications · Coach' };

export default async function CoachNotificationsPage({
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
        subtitle="Session changes, film-room notes and trial offers."
        icon="bell"
      />
      <NotificationsView
        userId={session.user.id}
        basePath="/dashboard/coach/notifications"
        filter={filter}
        group={group}
      />
    </div>
  );
}
