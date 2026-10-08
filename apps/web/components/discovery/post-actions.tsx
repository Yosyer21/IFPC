'use client';

import { useActionState, useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { deletePostAction, reportPostAction, toggleLikeAction } from '@/app/actions/discovery';
import { IconMessageCircle, IconStar } from '@/components/dashboard/icons';
import { Button } from '@ifpc/ui';
import { ActionSubmit } from './action-submit';

const actionClass =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors';

/** Barra de interacción de una publicación: me gusta, comentar, compartir, borrar y denunciar. */
export function PostActions({
  postId,
  likes,
  comments,
  likedByMe,
  canDelete,
  canReport,
  redirectTo = '/dashboard/discovery',
}: {
  postId: string;
  likes: number;
  comments: number;
  likedByMe: boolean;
  canDelete: boolean;
  canReport: boolean;
  redirectTo?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [reportState, reportAction, reporting] = useActionState(reportPostAction, {});
  // El "me gusta" se pinta al instante y se confirma con la respuesta del servidor.
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
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleLike}
          disabled={pending}
          aria-pressed={like.liked}
          aria-label="Me gusta"
          className={`${actionClass} disabled:opacity-70 ${
            like.liked
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <IconStar className="h-3.5 w-3.5" />
          <span aria-live="polite">{like.count}</span>
        </button>

        <Link
          href={`/dashboard/discovery/${postId}`}
          aria-label="Comentarios"
          className={`${actionClass} text-muted-foreground hover:bg-white/5 hover:text-foreground`}
        >
          <IconMessageCircle className="h-3.5 w-3.5" />
          {comments}
        </Link>

        <button
          type="button"
          onClick={share}
          className={`${actionClass} text-muted-foreground hover:bg-white/5 hover:text-foreground`}
        >
          {copied ? 'Enlace copiado' : 'Compartir'}
        </button>

        {canDelete ? (
          <form action={deletePostAction} className="ml-auto">
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <ActionSubmit
              label="Borrar"
              variant="danger"
              confirmText="¿Borrar la publicación?"
            />
          </form>
        ) : null}

        {canReport ? (
          <details className={canDelete ? '' : 'ml-auto'}>
            <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground">
              Denunciar
            </summary>
            <form action={reportAction} className="mt-2 flex w-64 max-w-full flex-col gap-2">
              <input type="hidden" name="postId" value={postId} />
              <textarea
                name="reason"
                rows={2}
                required
                placeholder="Motivo de la denuncia"
                className="w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-xs outline-none focus:border-primary/60"
              />
              {reportState.error ? (
                <p className="text-xs text-destructive">{reportState.error}</p>
              ) : null}
              {reportState.success ? (
                <p className="text-xs text-emerald-400">{reportState.success}</p>
              ) : null}
              <Button type="submit" variant="outline" disabled={reporting} className="self-start text-xs">
                Enviar
              </Button>
            </form>
          </details>
        ) : null}
      </div>
    </div>
  );
}
