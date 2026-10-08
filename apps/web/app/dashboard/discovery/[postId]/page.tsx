import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { ROLE_LABELS } from '@ifpc/config';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { moderatePostAction, pinPostAction } from '@/app/actions/discovery';
import { ActionSubmit } from '@/components/discovery/action-submit';
import { CommentForm } from '@/components/discovery/comment-form';
import { CommentList } from '@/components/discovery/comment-list';
import { EditPostForm } from '@/components/discovery/edit-post-form';
import { PostCard } from '@/components/discovery/post-card';
import {
  getPostForViewer,
  getPostViewStats,
  listComments,
  trackPostView,
} from '@/lib/discovery';
import { canComment } from '@/lib/discovery-privacy';

export const metadata: Metadata = { title: 'Publicación' };

/** Detalle de una publicación: comentarios, edición del autor y alcance. */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const post = await getPostForViewer(postId, session.user.id);
  if (!post) notFound();

  // El alcance se cuenta al abrir el detalle y nunca para el propio autor.
  await trackPostView({ postId, authorUserId: post.author.id });

  const isAuthor = post.author.id === session.user.id;
  const [comments, stats, mayComment] = await Promise.all([
    listComments(postId, session.user.id),
    isAuthor ? getPostViewStats(postId) : Promise.resolve(null),
    canComment({
      viewerId: session.user.id,
      authorId: post.author.id,
      policy: post.commentsPolicy,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/discovery"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver al feed
      </Link>

      <div className="mt-4">
        <PostCard post={post} viewerId={session.user.id} viewerRole={session.user.role} />
      </div>

      {isAuthor && post.status === 'HIDDEN' ? (
        <Card className="mt-4">
          <CardContent>
            <p className="text-sm text-amber-400">
              Tu publicación está en revisión por el equipo de moderación y todavía no es visible
              para el resto.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isAuthor && stats ? (
        <Card className="mt-4">
          <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="success">Alcance</Badge>
            <span>
              <strong className="text-foreground">{stats.viewers}</strong> personas ·{' '}
              {stats.views} aperturas
            </span>
            {stats.byRole.length > 0 ? (
              <span>
                ({stats.byRole.map((row) => `${row.viewers} ${ROLE_LABELS[row.role] ?? row.role}`).join(', ')})
              </span>
            ) : null}
            {stats.anonymousViews > 0 ? (
              <span>· {stats.anonymousViews} aperturas anónimas (web pública)</span>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isAuthor ? (
        <EditPostForm postId={post.id} title={post.title} body={post.body} tags={post.tags} />
      ) : null}

      {session.user.role === 'ADMIN' ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <form action={moderatePostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input
              type="hidden"
              name="status"
              value={post.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN'}
            />
            <ActionSubmit
              label={post.status === 'HIDDEN' ? 'Volver a publicar' : 'Ocultar (moderación)'}
            />
          </form>

          <form action={pinPostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <ActionSubmit label={post.pinned ? 'Desfijar del feed' : 'Fijar en el feed'} />
          </form>
        </div>
      ) : null}

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-4">
          <h2 className="font-semibold">Comentarios ({comments.length})</h2>
          <CommentList
            comments={comments}
            postId={post.id}
            viewerId={session.user.id}
            viewerRole={session.user.role}
            postAuthorId={post.author.id}
          />
          {mayComment ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {post.commentsPolicy === 'NOBODY'
                ? 'El autor ha cerrado los comentarios de esta publicación.'
                : 'No puedes comentar en esta publicación.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}