'use client';

import { useActionState } from 'react';
import { updateCommentAction } from '@/app/actions/discovery';
import { POST_COMMENT_MAX } from '@ifpc/validation';
import { Button } from '@ifpc/ui';

const fieldClass =
  'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40';

/** Edita el texto de un comentario propio. */
export function EditCommentForm({ commentId, body }: { commentId: string; body: string }) {
  const [state, formAction, pending] = useActionState(updateCommentAction, {});

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="commentId" value={commentId} />
      <textarea
        name="body"
        rows={2}
        required
        maxLength={POST_COMMENT_MAX}
        defaultValue={body}
        aria-label="Editar comentario"
        className={fieldClass}
      />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-400">{state.success}</p> : null}
      <Button type="submit" variant="outline" disabled={pending} className="self-start text-xs">
        {pending ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  );
}
