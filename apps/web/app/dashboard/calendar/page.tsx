import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { CalendarScreen } from '@/components/calendar/calendar-screen';

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
    <CalendarScreen
      viewer={{
        id: session.user.id,
        role: String(session.user.role ?? 'PLAYER'),
        name: session.user.name ?? '',
      }}
      monthValue={month}
      dayValue={day}
    />
  );
}
