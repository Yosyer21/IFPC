import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { FilmClipForm } from '@/components/film-room/clip-form';
import {
  FILM_CLIP_CATEGORY_LABELS,
  FILM_CLIP_STATUS_LABELS,
  formatTimestamp,
} from '@/lib/film-room';

export const metadata: Metadata = { title: 'Film Room' };

export default async function PlayerFilmRoomPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) return null;

  const clips = await prisma.filmClip.findMany({
    where: { playerId: player.id },
    include: {
      notes: { orderBy: { timestampSeconds: 'asc' } },
      post: { select: { id: true, _count: { select: { likes: true, comments: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Film Room"
        subtitle="Upload clips, ask your coach and get timestamped feedback. Clips are also published to Discovery."
        icon="play"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardContent>
            <h2 className="mb-3 font-semibold">Upload a clip</h2>
            <FilmClipForm />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              My clips
            </h2>
            <Link
              href="/dashboard/discovery/tag/filmroom"
              className="text-sm text-[#4f6b0a] hover:underline"
            >
              Film Room on Discovery →
            </Link>
          </div>

          {clips.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No clips yet. Upload your first one and your coach will get a notification.
                </p>
              </CardContent>
            </Card>
          ) : (
            clips.map((clip) => (
              <Card key={clip.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{clip.title}</h3>
                      <p className="text-xs text-muted-foreground">
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
                  ) : (
                    <p className="text-xs text-muted-foreground">Waiting for coach feedback.</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{clip.post._count.likes} likes</span>
                    <span>{clip.post._count.comments} comments</span>
                    <Link
                      href={`/dashboard/discovery/${clip.post.id}`}
                      className="text-[#4f6b0a] hover:underline"
                    >
                      View on Discovery →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
