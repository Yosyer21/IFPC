import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { ROLE_LABELS } from '@ifpc/config';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { moderatePostAction } from '@/app/actions/discovery';
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
  const [comments, stats] = await Promise.all([
    listComments(postId),
    isAuthor ? getPostViewStats(postId) : Promise.resolve(null),
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
          </CardContent>
        </Card>
      ) : null}

      {isAuthor ? (
        <EditPostForm postId={post.id} title={post.title} body={post.body} tags={post.tags} />
      ) : null}

      {session.user.role === 'ADMIN' ? (
        <form action={moderatePostAction} className="mt-4">
          <input type="hidden" name="postId" value={post.id} />
          <input
            type="hidden"
            name="status"
            value={post.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN'}
          />
          <button
            type="submit"
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            {post.status === 'HIDDEN' ? 'Volver a publicar' : 'Ocultar (moderación)'}
          </button>
        </form>
      ) : null}

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-4">
          <h2 className="font-semibold">Comentarios ({comments.length})</h2>
          <CommentList
            comments={comments}
            viewerId={session.user.id}
            viewerRole={session.user.role}
            postAuthorId={post.author.id}
          />
          <CommentForm postId={post.id} />
        </CardContent>
      </Card>
    </div>
  );
}
