'use client';

import { useActionState, useId, useState } from 'react';
import { createPostAction } from '@/app/actions/discovery';
import { POST_TYPE_LABELS } from '@ifpc/config';
import { POST_BODY_MAX, POST_TAGS_MAX } from '@ifpc/validation';
import { Button, Input } from '@ifpc/ui';
import { POST_GALLERY_MAX } from '@/lib/discovery-content';
import { COMMENTS_POLICY_LABELS } from '@/lib/labels';

const fieldClass =
  'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40';

/**
 * Publica en el feed. El tipo se deduce del medio adjunto (una imagen se
 * publica como Foto y un vídeo como Vídeo), así que aquí solo se elige entre
 * anuncio y logro. Admite galería con texto alternativo, menciones (@perfil),
 * encuesta, guardado como borrador y publicación programada.
 */
export function PostComposer({
  mentions = [],
}: {
  /** Perfiles sugeridos para mencionar (los inserta como `@Nombre`). */
  mentions?: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPostAction, {});
  const [body, setBody] = useState('');
  const bodyId = useId();
  const typeId = useId();
  const tagsId = useId();
  const fileId = useId();
  const galleryId = useId();
  const altId = useId();
  const urlId = useId();
  const policyId = useId();
  const scheduleId = useId();
  const pollId = useId();

  const insertMention = (name: string) =>
    setBody((value) =>
      `${value.length === 0 || value.endsWith(' ') ? value : `${value} `}@${name} `
    );

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
          placeholder="Un fichaje, una convocatoria, tus highlights… Usa #etiquetas para que te encuentren y @nombre para mencionar."
          className={fieldClass}
        />
        <span className="self-end text-xs text-muted-foreground">
          {body.length}/{POST_BODY_MAX}
        </span>
      </div>

      {mentions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Mencionar a:</span>
          {mentions.map((mention) => (
            <button
              key={mention.id}
              type="button"
              onClick={() => insertMention(mention.name)}
              className="rounded-full border border-border px-2 py-0.5 text-xs transition-colors hover:border-primary/60"
            >
              @{mention.name}
            </button>
          ))}
        </div>
      ) : null}

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={galleryId} className="text-sm font-medium">
            Galería (hasta {POST_GALLERY_MAX} imágenes)
          </label>
          <input
            id={galleryId}
            name="files"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
          />
          <span className="text-xs text-muted-foreground">Se muestran en cuadrícula.</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={altId} className="text-sm font-medium">
            Texto alternativo (accesibilidad)
          </label>
          <input
            id={altId}
            name="mediaAlt"
            maxLength={200}
            placeholder="Describe la imagen"
            className={fieldClass}
          />
          <span className="text-xs text-muted-foreground">
            Lo leen los lectores de pantalla y los buscadores.
          </span>
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

      <fieldset className="flex flex-col gap-2 rounded-xl border border-border/70 p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Encuesta (opcional)
        </legend>
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            name="pollOption"
            maxLength={80}
            placeholder={index < 2 ? `Opción ${index + 1} (mínimo dos)` : `Opción ${index + 1}`}
            className={fieldClass}
          />
        ))}
        <span className="text-xs text-muted-foreground">
          Deja vacías las opciones que no uses: con dos basta y admite hasta cuatro.
        </span>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={policyId} className="text-sm font-medium">
            Comentarios
          </label>
          <select
            id={policyId}
            name="commentsPolicy"
            defaultValue="EVERYONE"
            className={`${fieldClass} w-auto`}
          >
            {Object.entries(COMMENTS_POLICY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={scheduleId} className="text-sm font-medium">
            Programar
          </label>
          <input
            id={scheduleId}
            name="publishAt"
            type="datetime-local"
            className={`${fieldClass} w-auto`}
          />
          <span className="text-xs text-muted-foreground">Sale sola a esa hora.</span>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <div className="flex items-center justify-end gap-2 self-end">
        <Button type="submit" name="intent" value="draft" variant="ghost" disabled={pending}>
          Guardar borrador
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Publicando…' : 'Publicar'}
        </Button>
      </div>
    </form>
  );
}
