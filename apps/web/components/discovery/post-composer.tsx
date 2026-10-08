'use client';

import { useActionState, useId, useState } from 'react';
import { createPostAction } from '@/app/actions/discovery';
import { POST_TYPE_LABELS } from '@ifpc/config';
import { POST_BODY_MAX, POST_TAGS_MAX } from '@ifpc/validation';
import { Button, Input } from '@ifpc/ui';

const fieldClass =
  'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40';

/**
 * Publica en el feed. El tipo se deduce del medio adjunto (una imagen se
 * publica como Foto y un vídeo como Vídeo), así que aquí solo se elige entre
 * anuncio y logro.
 */
export function PostComposer() {
  const [state, formAction, pending] = useActionState(createPostAction, {});
  const [body, setBody] = useState('');
  const bodyId = useId();
  const typeId = useId();
  const tagsId = useId();
  const fileId = useId();
  const urlId = useId();

  return (
    <form action={formAction} className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={typeId} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tipo
        </label>
        <select id={typeId} name="type" defaultValue="ANNOUNCEMENT" className={`${fieldClass} w-auto`}>
          <option value="ANNOUNCEMENT">{POST_TYPE_LABELS.ANNOUNCEMENT}</option>
          <option value="ACHIEVEMENT">{POST_TYPE_LABELS.ACHIEVEMENT}</option>
        </select>
        <span className="text-xs text-muted-foreground">
          Con foto o vídeo se clasifica solo.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={bodyId} className="text-sm font-medium">
          ¿Qué quieres contar?
        </label>
        <textarea
          id={bodyId}
          name="body"
          rows={3}
          maxLength={POST_BODY_MAX}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Un fichaje, una convocatoria, tus highlights… Usa #etiquetas para que te encuentren."
          className={fieldClass}
        />
        <span className="self-end text-xs text-muted-foreground">
          {body.length}/{POST_BODY_MAX}
        </span>
      </div>

      <Input name="title" label="Título (opcional)" placeholder="Resumen de una línea" />
      <Input name="linkUrl" label="Enlace (opcional)" type="url" placeholder="https://…" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={fileId} className="text-sm font-medium">
            Foto o vídeo
          </label>
          <input
            id={fileId}
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
          />
          <span className="text-xs text-muted-foreground">
            JPG/PNG/WebP máx. 4 MB · MP4/WebM/MOV máx. 25 MB
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={urlId} className="text-sm font-medium">
            …o vídeo de YouTube/Vimeo
          </label>
          <input
            id={urlId}
            name="mediaUrl"
            type="url"
            placeholder="https://youtu.be/…"
            className={fieldClass}
          />
          <span className="text-xs text-muted-foreground">Recomendado para vídeos largos.</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={tagsId} className="text-sm font-medium">
          Etiquetas
        </label>
        <input
          id={tagsId}
          name="tags"
          placeholder={`#sub17 #portero (máx. ${POST_TAGS_MAX})`}
          className={fieldClass}
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? 'Publicando…' : 'Publicar'}
      </Button>
    </form>
  );
}
