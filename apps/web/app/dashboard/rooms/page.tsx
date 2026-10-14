import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { TrainingRoomForm } from '@/components/room/room-form';
import { endTrainingRoomAction, deleteTrainingRoomAction } from '@/app/actions/training-rooms';
import { playerTrainingAudience, trainingAuthor } from '@/lib/training';
import { authorPlayers } from '@/lib/training-assignments';
import { listAuthoredRooms, listPlayerRooms, roomWindow } from '@/lib/training-rooms';

export const metadata: Metadata = { title: 'Live rooms' };

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  LIVE: 'Live',
  ENDED: 'Ended',
  CANCELLED: 'Cancelled',
};

/** Hora corta para la lista (el navegador del usuario pone su zona). */
function whenLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Salas de vídeo: los coaches y los clubes abren una sala y los jugadores
 * invitados entran desde el mismo enlace. Todo dentro de la app.
 */
export default async function RoomsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const author = await trainingAuthor(session.user.id);
  const isAuthor = Boolean(author.coachId || author.clubId);

  const audience = isAuthor ? null : await playerTrainingAudience(session.user.id);
  const [rooms, players] = await Promise.all([
    isAuthor ? listAuthoredRooms(author) : listPlayerRooms(audience!),
    isAuthor ? authorPlayers(author) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Live rooms"
        subtitle="Your own video rooms: up to 4 people, no external links"
        icon="live"
      />

      {isAuthor ? (
        <Card className="mb-6">
          <CardContent>
            <h2 className="mb-3 font-semibold">Open a room</h2>
            <TrainingRoomForm players={players} />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4">
        {rooms.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isAuthor
                  ? 'No rooms yet: open the first one above and invite your players.'
                  : 'No rooms for you yet. Your coach or your club will invite you here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          rooms.map((room) => {
            const window = roomWindow(room);
            return (
              <Card key={room.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={room.status === 'LIVE' ? 'success' : 'outline'}>
                      {STATUS_LABELS[room.status] ?? room.status}
                    </Badge>
                    <Badge variant="outline">
                      {room.present.length}/{room.maxParticipants} inside
                    </Badge>
                    {room.invites.length > 0 ? (
                      <Badge variant="outline">
                        {room.invites.length} invited
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">{whenLabel(room.startsAt)}</span>
                  </div>

                  <div>
                    <p className="font-semibold">{room.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {room.author.name}
                      {room.description ? ` · ${room.description}` : ''}
                    </p>
                    {room.present.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Inside: {room.present.map((row) => row.name).join(', ')}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {window.open ? (
                      <Link
                        href={`/dashboard/rooms/${room.joinCode}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {isAuthor ? 'Open room' : 'Join room'}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {window.reason === 'before'
                          ? `Opens in ${window.opensInMinutes} min`
                          : 'Closed'}
                      </span>
                    )}
                    {isAuthor ? (
                      room.status === 'ENDED' || room.status === 'CANCELLED' ? (
                        <form action={deleteTrainingRoomAction}>
                          <input type="hidden" name="roomId" value={room.id} />
                          <button
                            type="submit"
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            Delete
                          </button>
                        </form>
                      ) : (
                        <form action={endTrainingRoomAction}>
                          <input type="hidden" name="roomId" value={room.id} />
                          <button
                            type="submit"
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            End room
                          </button>
                        </form>
                      )
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
