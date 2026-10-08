import Image from 'next/image';
import Link from 'next/link';
import { POST_TYPE_LABELS } from '@ifpc/config';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import { MatchScoreBadge } from '@/components/player/match-score';
import { formatRelativeTime, resolveEmbed, type FeedPost } from '@/lib/discovery';
import { PLAYER_MATCH_THRESHOLD } from '@/lib/matching';
import { nameParts } from '@/lib/names';
import { PostActions } from './post-actions';

/** Tarjeta de una publicación del feed. El texto se renderiza como texto plano. */
export function PostCard({
  post,
  viewerId,
  viewerRole,
}: {
  post: FeedPost;
  viewerId: string;
  viewerRole: string;
}) {
  const { firstName, lastName } = nameParts(post.author.name);
  const embed = post.mediaKind === 'embed' ? resolveEmbed(post.mediaUrl) : null;
  const isAuthor = post.author.id === viewerId;
  const canDelete = isAuthor || viewerRole === 'ADMIN';

  return (
    <Card className="animate-fade-up">
      <CardContent>
        <div className="flex items-start gap-3">
          <Link href={`/dashboard/discovery/u/${post.author.id}`} aria-label={post.author.name}>
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
                href={`/dashboard/discovery/u/${post.author.id}`}
                className="truncate font-semibold hover:text-emerald-400"
              >
                {post.author.name}
              </Link>
              <Badge variant="outline">{POST_TYPE_LABELS[post.type] ?? post.type}</Badge>
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

            {post.mediaKind === 'image' && post.mediaUrl ? (
              <Image
                src={post.mediaUrl}
                alt=""
                width={1024}
                height={576}
                unoptimized
                className="mt-3 h-auto w-full rounded-xl border border-white/10"
              />
            ) : null}

            {post.mediaKind === 'video' && post.mediaUrl ? (
              <video
                src={post.mediaUrl}
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
                    href={`/dashboard/discovery/tag/${tag}`}
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

        <PostActions
          postId={post.id}
          likes={post.counts.likes}
          comments={post.counts.comments}
          likedByMe={post.likedByMe}
          canDelete={canDelete}
          canReport={!isAuthor}
        />
      </CardContent>
    </Card>
  );
}
