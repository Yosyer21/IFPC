import type { Metadata } from 'next';
import { PreviewShell } from '@/components/preview/preview-shell';
import { CalendarView } from '@/components/preview/calendar-view';

export const metadata: Metadata = { title: 'My Calendar · Future Baller' };

export default function CalendarPreviewPage() {
  return (
    <PreviewShell
      active="calendar"
      userName="Demo Player"
      searchPlaceholder="Search players, coaches, clubs, schools"
    >
      <CalendarView />
    </PreviewShell>
  );
}
