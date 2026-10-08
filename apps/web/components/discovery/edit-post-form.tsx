'use client';

import { useActionState } from 'react';
import { updatePostAction } from '@/app/actions/discovery';
import { POST_BODY_MAX, POST_TAGS_MAX } from '@ifpc/validation';
import { Button, Input } from '@ifpc/ui';

const fieldClass =
  'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40';

/** Edición del texto de una publicación propia (el medio no se toca). */
export function EditPostForm({
  postId,
  title,
  body,
  tags,
}: {
  postId: string;
  title: string | null;
  body: string | null;
  tags: string[];
}) {
  const [state, formAction, pending] = useActionState(updatePostAction, {});

  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
        Editar publicación
      </summary>
      <form action={formAction} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="postId" value={postId} />
        <Input name="title" label="Título (opcional)" defaultValue={title ?? ''} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-body" className="text-sm font-medium">
            Texto
          </label>
          <textarea
            id="edit-body"
            name="body"
            rows={3}
            maxLength={POST_BODY_MAX}
            defaultValue={body ?? ''}
            className={fieldClass}
          />
        </div>
        <Input
          name="tags"
          label={`Etiquetas (máx. ${POST_TAGS_MAX})`}
          defaultValue={tags.join(' ')}
        />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>
    </details>
  );
}
