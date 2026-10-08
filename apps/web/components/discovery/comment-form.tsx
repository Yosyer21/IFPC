'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createCommentAction } from '@/app/actions/discovery';
import { POST_COMMENT_MAX } from '@ifpc/validation';
import { Button } from '@ifpc/ui';

const fieldClass =
  'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40';

/** Añade un comentario a una publicación (o una respuesta si se pasa `parentId`). */
export function CommentForm({ postId, parentId }: { postId: string; parentId?: string }) {
  const [state, formAction, pending] = useActionState(createCommentAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Tras enviar, se limpia el campo para el siguiente comentario.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <textarea
        name="body"
        rows={2}
        required
        maxLength={POST_COMMENT_MAX}
        placeholder={parentId ? 'Responder…' : 'Escribe un comentario…'}
        className={fieldClass}
      />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start text-xs">
        {pending ? 'Enviando…' : parentId ? 'Responder' : 'Comentar'}
      </Button>
    </form>
  );
}
