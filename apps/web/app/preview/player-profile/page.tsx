import type { Metadata } from 'next';
import { PreviewShell } from '@/components/preview/preview-shell';
import { PlayerIdView } from '@/components/preview/player-id-view';

export const metadata: Metadata = { title: 'Player ID · Future Baller' };

export default function PlayerProfilePreviewPage() {
  return (
    <PreviewShell
      active="profile"
      userName="Demo Player"
      searchPlaceholder="Search sessions, drills, guides"
    >
      <PlayerIdView />
    </PreviewShell>
  );
}
