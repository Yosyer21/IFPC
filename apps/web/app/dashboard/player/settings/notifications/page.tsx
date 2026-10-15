import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { NotificationPreferencesForm } from '@/components/account/notification-preferences-form';
import { PageHeader } from '@/components/player/page-header';
import { mergePreferences, wantsWeeklyDigest } from '@/lib/notifications/preferences';

export const metadata: Metadata = { title: 'Notification preferences' };

/**
 * Ajustes de avisos: elige qué categorías llegan a la bandeja de la plataforma y
 * cuáles se mandan además por email. Las categorías son las que ya genera la
 * plataforma (`lib/notifications/preferences`).
 */
export default async function PlayerNotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user, rows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    }),
    prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
      select: { category: true, inApp: true, email: true },
    }),
  ]);
  if (!user) return null;

  const preferences = mergePreferences(rows);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications" subtitle="What reaches you and where" icon="bell">
        <Link
          href="/dashboard/player/settings"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Settings
        </Link>
      </PageHeader>

      <Card className="animate-fade-up">
        <CardContent className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">
            Choose what reaches you <strong>inside the platform</strong> (the bell in the top bar)
            and, if you want, a copy <strong>by email</strong> to {user.email}. Email copies need a
            verified address.
          </p>
          <NotificationPreferencesForm
            preferences={preferences}
            digestEnabled={wantsWeeklyDigest(rows)}
            emailVerified={Boolean(user.emailVerified)}
          />
        </CardContent>
      </Card>

      <Card className="animate-fade-up mt-4">
        <CardContent className="flex flex-col gap-2">
          <h2 className="font-semibold">Emails you always get</h2>
          <p className="text-sm text-muted-foreground">
            Account security emails (confirming your address, recovering your password) cannot be
            turned off: they are the only way back into your account.
          </p>
          <Link
            href="/dashboard/player/notifications"
            className="text-sm text-primary hover:underline"
          >
            See my notifications →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
