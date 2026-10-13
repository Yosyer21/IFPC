import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Notification preferences' };

export default async function PlayerNotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/settings"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Settings
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Notifications</h1>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>You will receive notifications within the platform for events such as:</p>
          <ul className="list-inside list-disc">
            <li>A club reply to your request</li>
            <li>New opportunities that match your profile</li>
            <li>Trial and evaluation results</li>
            <li>Messages de scouts y agents</li>
          </ul>
          <p>
            Channel preferences (email/push) will be configured in upcoming phases. Notifications
            actuales aparecen en <Link href="/dashboard/player/notifications" className="text-primary hover:underline">Notifications</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
