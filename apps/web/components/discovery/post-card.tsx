import Image from 'next/image';
import Link from 'next/link';
import { POST_TYPE_LABELS } from '@ifpc/config';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import { MatchScoreBadge } from '@/components/player/match-score';
import { votePollAction } from '@/app/actions/discovery';
import { formatRelativeTime, resolveEmbed, type FeedPost } from '@/lib/discovery-content';
import { PLAYER_MATCH_THRESHOLD } from '@/lib/matching';
import { nameParts } from '@/lib/names';
import { PostActions } from './post-actions';

/** Tarjeta de una publicación del feed. El texto se renderiza como texto plano. */
export function PostCard({
  post,
  viewerId,
  viewerRole,
  readOnly = false,
  notInterested = false,
}: {
  post: FeedPost;
  viewerId: string;
  viewerRole: string;
  /** Espejo público: sin acciones (solo el resumen de interacción) y enlaces públicos. */
  readOnly?: boolean;
  /** El espectador marcó esta publicación como "no me interesa". */
  notInterested?: boolean;
}) {
  const { firstName, lastName } = nameParts(post.author.name);
  const embed = post.mediaKind === 'embed' ? resolveEmbed(post.mediaUrl) : null;
  const isAuthor = post.author.id === viewerId;
  const canDelete = !readOnly && (isAuthor || viewerRole === 'ADMIN');
  const base = readOnly ? '/discovery' : '/dashboard/discovery';
  const pollTotal = post.pollCounts.reduce((sum, count) => sum + count, 0);

  return (
    <Card className="animate-fade-up">
      <CardContent>
        <div className="flex items-start gap-3">
          <Link href={`${base}/u/${post.author.id}`} aria-label={post.author.name}>
            <PlayerAvatar
              firstName={firstName}
              lastName={lastName}
              imageUrl={post.author.image}
              size="sm"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`${base}/u/${post.author.id}`}
                className="truncate font-semibold hover:text-emerald-400"
              >
                {post.author.name}
              </Link>
              <Badge variant="outline">{POST_TYPE_LABELS[post.type] ?? post.type}</Badge>
              {post.pinned ? <Badge variant="success">Fijado</Badge> : null}
              {post.relevance !== null &&
              post.relevance !== undefined &&
              post.relevance >= PLAYER_MATCH_THRESHOLD ? (
                <MatchScoreBadge score={post.relevance} />
              ) : null}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>

            {post.title ? <h2 className="mt-2 font-semibold">{post.title}</h2> : null}
            {post.body ? (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {post.body}
              </p>
            ) : null}

            {/* Galería: se pinta siempre que haya varias imágenes, incluso si el
                medio principal es un vídeo. */}
            {post.mediaUrls.length > 1 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.mediaUrls.map((url, index) => (
                  <Image
                    key={`${url}-${index}`}
                    src={url}
                    alt={
                      post.mediaAlt
                        ? `${post.mediaAlt} (${index + 1}/${post.mediaUrls.length})`
                        : ''
                    }
                    width={512}
                    height={512}
                    unoptimized
                    className="h-40 w-full rounded-xl border border-white/10 object-cover"
                  />
                ))}
              </div>
            ) : null}

            {post.mediaKind === 'image' && post.mediaUrls.length <= 1 && post.mediaUrl ? (
              <Image
                src={post.mediaUrl}
                alt={post.mediaAlt ?? ''}
                width={1024}
                height={576}
                unoptimized
                className="mt-3 h-auto w-full rounded-xl border border-white/10"
              />
            ) : null}

            {post.mediaKind === 'video' && post.mediaUrl ? (
              <video
                src={post.mediaUrl}
                poster={post.posterUrl ?? undefined}
                controls
                preload="metadata"
                className="mt-3 aspect-video w-full rounded-xl border border-white/10 bg-black"
              />
            ) : null}

            {embed ? (
              <iframe
                src={embed}
                title={post.title ?? 'Vídeo'}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="mt-3 aspect-video w-full rounded-xl border border-white/10"
              />
            ) : null}

            {post.pollOptions.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Encuesta · {pollTotal} {pollTotal === 1 ? 'voto' : 'votos'}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {post.pollOptions.map((option, index) => {
                    const votes = post.pollCounts[index] ?? 0;
                    const percent = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                    const voted = post.myPollVote === index;
                    const row = (
                      <>
                        <span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-emerald-500/15" style={{ width: `${percent}%` }} />
                        <span className="relative flex-1 text-left text-sm">
                          {voted ? '✓ ' : ''}
                          {option}
                        </span>
                        <span className="relative text-xs text-muted-foreground">
                          {percent}% · {votes}
                        </span>
                      </>
                    );

                    return (
                      <li key={`${option}-${index}`} className="overflow-hidden rounded-lg border border-border/60">
                        {readOnly ? (
                          <span className="relative flex items-center justify-between gap-2 px-3 py-2">
                            {row}
                          </span>
                        ) : (
                          <form
                            action={votePollAction}
                            className="relative flex items-center justify-between gap-2 px-3 py-2"
                          >
                            <input type="hidden" name="postId" value={post.id} />
                            <input type="hidden" name="optionIndex" value={index} />
                            <input type="hidden" name="from" value={base} />
                            <button
                              type="submit"
                              className="relative flex flex-1 items-center justify-between gap-2 text-left"
                              aria-label={`Votar ${option}`}
                            >
                              {row}
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {readOnly ? null : (
                  <p className="text-xs text-muted-foreground">
                    Un voto por persona; puedes cambiarlo cuando quieras.
                  </p>
                )}
              </div>
            ) : null}

            {post.opportunity ? (
              <Link
                href={`/opportunities/${post.opportunity.id}`}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:border-emerald-500/60"
              >
                Oportunidad compartida: {post.opportunity.title}
              </Link>
            ) : null}

            {post.linkUrl ? (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 block truncate text-sm text-emerald-400 hover:underline"
              >
                {post.linkUrl}
              </a>
            ) : null}

            {post.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`${base}/tag/${tag}`}
                    className="text-xs text-emerald-400/80 hover:text-emerald-300"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}

            {isAuthor && post.counts.views > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {post.counts.views} {post.counts.views === 1 ? 'persona lo vio' : 'personas lo vieron'}
              </p>
            ) : null}
          </div>
        </div>

        {readOnly ? (
          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-xs text-muted-foreground">
            <span>{post.counts.likes} me gusta</span>
            <Link href={`${base}/${post.id}`} className="hover:text-foreground">
              {post.counts.comments} comentarios
            </Link>
          </div>
        ) : (
          <PostActions
            postId={post.id}
            likes={post.counts.likes}
            comments={post.counts.comments}
            likedByMe={post.likedByMe}
            canDelete={canDelete}
            canReport={!isAuthor}
            notInterested={notInterested}
          />
        )}
      </CardContent>
    </Card>
  );
}
