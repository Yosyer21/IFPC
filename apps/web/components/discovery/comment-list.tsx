import Link from 'next/link';
import { deleteCommentAction } from '@/app/actions/discovery';
import { PlayerAvatar } from '@/components/player/avatar';
import { formatRelativeTime, type FeedComment } from '@/lib/discovery';
import { nameParts } from '@/lib/names';

/** Un comentario (con su botón de borrado si el espectador puede). */
function CommentRow({
  comment,
  canDelete,
}: {
  comment: FeedComment;
  canDelete: boolean;
}) {
  const { firstName, lastName } = nameParts(comment.author.name);

  return (
    <li className="flex items-start gap-3">
      <Link href={`/dashboard/discovery/u/${comment.author.id}`} aria-label={comment.author.name}>
        <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={comment.author.image} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/discovery/u/${comment.author.id}`}
            className="text-sm font-semibold hover:text-emerald-400"
          >
            {comment.author.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {comment.body}
        </p>
      </div>
      {canDelete ? (
        <form action={deleteCommentAction}>
          <input type="hidden" name="commentId" value={comment.id} />
          <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">
            Borrar
          </button>
        </form>
      ) : null}
    </li>
  );
}

/**
 * Comentarios de una publicación. Las respuestas (`parentId`) se muestran
 * indentadas bajo su comentario raíz.
 */
export function CommentList({
  comments,
  viewerId,
  viewerRole,
  postAuthorId,
}: {
  comments: FeedComment[];
  viewerId: string;
  viewerRole: string;
  postAuthorId: string;
}) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay comentarios. Sé el primero.</p>
    );
  }

  const canDelete = (comment: FeedComment) =>
    comment.author.id === viewerId || postAuthorId === viewerId || viewerRole === 'ADMIN';

  const roots = comments.filter((comment) => !comment.parentId);

  return (
    <ul className="flex flex-col gap-4">
      {roots.map((root) => (
        <li key={root.id} className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            <CommentRow comment={root} canDelete={canDelete(root)} />
          </ul>
          {comments.some((comment) => comment.parentId === root.id) ? (
            <ul className="ml-10 flex flex-col gap-3 border-l border-white/10 pl-3">
              {comments
                .filter((comment) => comment.parentId === root.id)
                .map((reply) => (
                  <CommentRow key={reply.id} comment={reply} canDelete={canDelete(reply)} />
                ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
