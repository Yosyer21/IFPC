import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';
import { CalendarScreen } from '@/components/calendar/calendar-screen';
import { MeetingForm } from '@/components/calendar/meeting-form';

export const metadata: Metadata = { title: 'My calendar' };

/**
 * Calendario del jugador: **misma pantalla** que el del resto de roles, con su
 * propia URL y su título. Los eventos salen de `listCalendarEvents` (sesiones,
 * pruebas aceptadas, camps, metas y trayectoria).
 */
export default async function PlayerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { month, day } = await searchParams;

  return (
    <div>
      <CalendarScreen
        viewer={{
          id: session.user.id,
          role: String(session.user.role ?? 'PLAYER'),
          name: session.user.name ?? '',
        }}
        monthValue={month}
        dayValue={day}
        basePath="/dashboard/player/calendar"
        title="My calendar"
        subtitle="Your sessions, trials, camps, deadlines and development milestones"
      />
      <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Set up a meeting</h2>
            <MeetingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
