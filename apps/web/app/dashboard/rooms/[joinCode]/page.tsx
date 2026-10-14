import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { RoomClient } from '@/components/room/room-client';
import { findRoomForUser, mintRoomToken, roomWindow } from '@/lib/training-rooms';

export const metadata: Metadata = { title: 'Room' };

/** URL del servicio de salas (`ws://` en local, `wss://` en producción). */
function rtcUrl(): string {
  return process.env.NEXT_PUBLIC_RTC_URL ?? 'ws://localhost:4001';
}

/** Explicación de por qué no se puede entrar todavía. */
function closedMessage(window: ReturnType<typeof roomWindow>): string | null {
  if (window.open) return null;
  if (window.reason === 'before') {
    return `This room opens in ${window.opensInMinutes} minute${window.opensInMinutes === 1 ? '' : 's'}.`;
  }
  return 'This room is closed.';
}

/**
 * Sala de vídeo. El servidor decide quién entra y emite el token firmado; a partir
 * de ahí los medios van por el servicio `rtc` (WebSocket), nunca por aquí.
 */
export default async function RoomPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const resolved = await findRoomForUser(session.user.id, joinCode);
  if (!resolved) notFound();

  const { room, viewer, window, allowed } = resolved;
  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-bold">This room is not for you</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rooms are private: only the author and the invited players can join.
        </p>
        <Link href="/dashboard/rooms" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <RoomClient
        rtcUrl={rtcUrl()}
        token={mintRoomToken(room, viewer)}
        room={{ id: room.id, title: room.title, maxParticipants: room.maxParticipants }}
        viewer={viewer}
        windowOpen={window.open}
        closedMessage={closedMessage(window)}
      />
    </div>
  );
}
