import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { CalendarScreen } from '@/components/calendar/calendar-screen';

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
  );
}
