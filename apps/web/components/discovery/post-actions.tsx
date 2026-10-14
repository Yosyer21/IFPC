'use client';

import { useActionState, useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  deletePostAction,
  notInterestedAction,
  reportPostAction,
  toggleLikeAction,
} from '@/app/actions/discovery';
import { IconMessageCircle, IconStar } from '@/components/dashboard/icons';
import { Button } from '@ifpc/ui';
import { ActionSubmit } from './action-submit';

const actionClass =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors';

/** Barra de interacción de una post: me gusta, comentar, compartir, borrar y denunciar. */
export function PostActions({
  postId,
  likes,
  comments,
  likedByMe,
  canDelete,
  canReport,
  notInterested = false,
  redirectTo = '/dashboard/discovery',
}: {
  postId: string;
  likes: number;
  comments: number;
  likedByMe: boolean;
  canDelete: boolean;
  canReport: boolean;
  /** El espectador ya la marcó como "no me interesa" (se puede deshacer). */
  notInterested?: boolean;
  redirectTo?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [reportState, reportAction, reporting] = useActionState(reportPostAction, {});
  // El "me gusta" se pinta al instante y se confirma con la reply del servidor.
  const [like, setLike] = useOptimistic({ liked: likedByMe, count: likes });
  const [pending, startTransition] = useTransition();

  const toggleLike = () => {
    startTransition(async () => {
      setLike({
        liked: !like.liked,
        count: Math.max(0, like.count + (like.liked ? -1 : 1)),
      });
      const data = new FormData();
      data.set('postId', postId);
      await toggleLikeAction(data);
    });
  };

  const share = async () => {
    const url = `${window.location.origin}/dashboard/discovery/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permisos de portapapeles: no se puede copiar.
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleLike}
          disabled={pending}
          aria-pressed={like.liked}
          aria-label="Likes"
          className={`${actionClass} disabled:opacity-70 ${
            like.liked ? 'text-brand' : 'text-muted-foreground hover:text-brand'
          }`}
        >
          <IconStar className="h-3.5 w-3.5" />
          <span aria-live="polite">{like.count}</span>
        </button>

        <Link
          href={`/dashboard/discovery/${postId}`}
          aria-label="Comments"
          className={`${actionClass} text-muted-foreground hover:text-brand`}
        >
          <IconMessageCircle className="h-3.5 w-3.5" />
          {comments}
        </Link>

        <button
          type="button"
          onClick={share}
          className={`${actionClass} text-muted-foreground hover:text-brand`}
        >
          {copied ? 'Link copied' : 'Share'}
        </button>

        {canReport ? (
          <form action={notInterestedAction}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="value" value={notInterested ? 'off' : 'on'} />
            <input type="hidden" name="from" value={redirectTo} />
            <ActionSubmit label={notInterested ? 'Show again' : 'Not interested'} variant="ghost" />
          </form>
        ) : null}

        {canDelete ? (
          <form action={deletePostAction} className="ml-auto">
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <ActionSubmit label="Delete" variant="danger" confirmText="Delete the post?" />
          </form>
        ) : null}

        {canReport ? (
          <details className={canDelete ? '' : 'ml-auto'}>
            <summary className="cursor-pointer list-none text-xs text-muted-foreground transition-colors hover:text-brand">
              Report
            </summary>
            <form action={reportAction} className="mt-2 flex w-64 max-w-full flex-col gap-2">
              <input type="hidden" name="postId" value={postId} />
              <textarea
                name="reason"
                rows={2}
                required
                placeholder="Reason for the report"
                className="w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-xs outline-none focus:border-primary/60"
              />
              {reportState.error ? (
                <p className="text-xs text-destructive">{reportState.error}</p>
              ) : null}
              {reportState.success ? (
                <p className="text-xs text-brand">{reportState.success}</p>
              ) : null}
              <Button
                type="submit"
                variant="outline"
                disabled={reporting}
                className="self-start text-xs"
              >
                Send
              </Button>
            </form>
          </details>
        ) : null}
      </div>
    </div>
  );
}
