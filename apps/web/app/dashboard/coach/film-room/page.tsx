import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { FilmClipNoteForm } from '@/components/film-room/clip-note-form';
import { FILM_CLIP_CATEGORY_LABELS, FILM_CLIP_STATUS_LABELS, formatTimestamp } from '@/lib/film-room';

export const metadata: Metadata = { title: 'Film Room · Coach' };

export default async function CoachFilmRoomPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return null;

  const clips = await prisma.filmClip.findMany({
    where: { player: { coaches: { some: { coachId: coach.id } } } },
    include: {
      player: { select: { firstName: true, lastName: true } },
      notes: { orderBy: { timestampSeconds: 'asc' } },
      post: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Film Room"
        subtitle="Review your players' clips and leave timestamped feedback. It also appears in Discovery."
        icon="play"
      />

      {clips.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No clips from your players yet. They appear here as soon as they upload one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {clips.map((clip) => (
            <Card key={clip.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{clip.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {clip.player.firstName} {clip.player.lastName} ·{' '}
                      {FILM_CLIP_CATEGORY_LABELS[clip.category]} ·{' '}
                      {clip.createdAt.toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      clip.status === 'REVIEWED'
                        ? 'bg-brand/15 text-[#4f6b0a]'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {FILM_CLIP_STATUS_LABELS[clip.status]}
                  </span>
                </div>

                <video src={clip.videoUrl} controls preload="metadata" className="w-full rounded-xl" />

                {clip.question ? (
                  <p className="text-sm text-muted-foreground">Q: {clip.question}</p>
                ) : null}

                {clip.notes.length > 0 ? (
                  <ul className="flex flex-col divide-y divide-border/60">
                    {clip.notes.map((note) => (
                      <li key={note.id} className="py-1.5 text-sm">
                        <span className="font-mono text-xs text-[#4f6b0a]">
                          {formatTimestamp(note.timestampSeconds)}
                        </span>{' '}
                        · {note.body}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <FilmClipNoteForm clipId={clip.id} />

                <Link
                  href={`/dashboard/discovery/${clip.post.id}`}
                  className="text-xs text-[#4f6b0a] hover:underline"
                >
                  View on Discovery →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
