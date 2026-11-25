import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';
import { CalendarScreen } from '@/components/calendar/calendar-screen';
import { MeetingForm } from '@/components/calendar/meeting-form';

export const metadata: Metadata = { title: 'Calendar' };

/**
 * Calendario de club, coach, parent, agente, scout, universidad, school y admin.
 * Comparte pantalla con el del jugador (`/dashboard/player/calendar`).
 */
export default async function CalendarPage({
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
