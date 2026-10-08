import Link from 'next/link';
import { deleteCommentAction } from '@/app/actions/discovery';
import { PlayerAvatar } from '@/components/player/avatar';
import { formatRelativeTime, type FeedComment } from '@/lib/discovery-content';
import { nameParts } from '@/lib/names';
import { CommentForm } from './comment-form';
import { EditCommentForm } from './edit-comment-form';

/** Un comentario con sus acciones (responder, editar y borrar). */
function CommentRow({
  comment,
  postId,
  canDelete,
  canEdit,
  readOnly,
  base,
}: {
  comment: FeedComment;
  postId: string;
  canDelete: boolean;
  canEdit: boolean;
  readOnly: boolean;
  base: string;
}) {
  const { firstName, lastName } = nameParts(comment.author.name);

  return (
    <li className="flex items-start gap-3">
      <Link href={`${base}/u/${comment.author.id}`} aria-label={comment.author.name}>
        <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={comment.author.image} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${base}/u/${comment.author.id}`}
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

        {readOnly ? null : (
          <div className="mt-1 flex flex-wrap items-start gap-3 text-xs">
            <details>
              <summary className="cursor-pointer list-none text-muted-foreground transition-colors hover:text-foreground">
                Responder
              </summary>
              <div className="mt-2 w-full min-w-0">
                <CommentForm postId={postId} parentId={comment.id} />
              </div>
            </details>

            {canEdit ? (
              <details>
                <summary className="cursor-pointer list-none text-muted-foreground transition-colors hover:text-foreground">
                  Editar
                </summary>
                <EditCommentForm commentId={comment.id} body={comment.body} />
              </details>
            ) : null}

            {canDelete ? (
              <form action={deleteCommentAction}>
                <input type="hidden" name="commentId" value={comment.id} />
                <button
                  type="submit"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  Borrar
                </button>
              </form>
            ) : null}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Comentarios de una publicación. Las respuestas (`parentId`) se muestran
 * indentadas bajo su comentario raíz.
 */
export function CommentList({
  comments,
  postId,
  viewerId,
  viewerRole,
  postAuthorId,
  readOnly = false,
  base = '/dashboard/discovery',
}: {
  comments: FeedComment[];
  postId: string;
  viewerId: string;
  viewerRole: string;
  postAuthorId: string;
  /** Espejo público: sin acciones y con enlaces públicos. */
  readOnly?: boolean;
  base?: string;
}) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay comentarios. Sé el primero.</p>
    );
  }

  const canDelete = (comment: FeedComment) =>
    !readOnly &&
    (comment.author.id === viewerId || postAuthorId === viewerId || viewerRole === 'ADMIN');
  const canEdit = (comment: FeedComment) => !readOnly && comment.author.id === viewerId;

  const roots = comments.filter((comment) => !comment.parentId);

  return (
    <ul className="flex flex-col gap-4">
      {roots.map((root) => (
        <li key={root.id} className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            <CommentRow
              comment={root}
              postId={postId}
              canDelete={canDelete(root)}
              canEdit={canEdit(root)}
              readOnly={readOnly}
              base={base}
            />
          </ul>
          {comments.some((comment) => comment.parentId === root.id) ? (
            <ul className="ml-10 flex flex-col gap-3 border-l border-white/10 pl-3">
              {comments
                .filter((comment) => comment.parentId === root.id)
                .map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    canDelete={canDelete(reply)}
                    canEdit={canEdit(reply)}
                    readOnly={readOnly}
                    base={base}
                  />
                ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
