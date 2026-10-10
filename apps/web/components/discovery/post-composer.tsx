'use client';

import { useActionState, useId, useState } from 'react';
import { createPostAction } from '@/app/actions/discovery';
import { POST_TYPE_LABELS } from '@ifpc/config';
import { POST_BODY_MAX, POST_TAGS_MAX } from '@ifpc/validation';
import { Button, Input } from '@ifpc/ui';
import {
  IconCalendar,
  IconChart,
  IconChevronDown,
  IconImage,
  IconImages,
} from '@/components/dashboard/icons';
import { COMMENTS_POLICY_LABELS } from '@/lib/labels';

const fieldClass =
  'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40';

/** Botón de la barra inferior: solo icono, con nombre accesible oculto. */
const toolClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground';

/** Opciones de encuesta al abrirla y máximo que acepta la validación. */
const POLL_START = 2;
const POLL_MAX = 4;

/**
 * Publica en el feed con la mínima fricción: se escribe el texto y se publica.
 * Todo lo demás es opcional y aparece solo cuando hace falta —adjuntar medio,
 * galería, encuesta, programación o el bloque «Más opciones» (título, enlace,
 * texto alternativo, etiquetas, comentarios y tipo)—. El tipo se deduce del medio
 * adjunto: una imagen se publica como Foto y un vídeo como Vídeo.
 */
export function PostComposer({
  mentions = [],
}: {
  /** Perfiles sugeridos para mencionar (los inserta como `@Nombre`). */
  mentions?: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPostAction, {});
  const [body, setBody] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [schedule, setSchedule] = useState(false);
  const bodyId = useId();
  const typeId = useId();
  const tagsId = useId();
  const fileId = useId();
  const fileHintId = useId();
  const galleryId = useId();
  const altId = useId();
  const policyId = useId();
  const scheduleId = useId();
  const pollId = useId();

  const insertMention = (name: string) =>
    setBody(
      (value) => `${value.length === 0 || value.endsWith(' ') ? value : `${value} `}@${name} `
    );

  // Sugerencias de mención solo mientras se escribe una (texto que acaba en `@…`).
  const mentionFragment = /@([^@\s]*)$/u.exec(body)?.[1] ?? null;
  const suggestions =
    mentionFragment === null
      ? []
      : mentions
          .filter((mention) => mention.name.toLowerCase().includes(mentionFragment.toLowerCase()))
          .slice(0, 4);

  const nearLimit = body.length > POST_BODY_MAX * 0.9;

  return (
    <form action={formAction} className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-4">
      <textarea
        id={bodyId}
        name="body"
        rows={3}
        maxLength={POST_BODY_MAX}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="¿Qué quieres contar?"
        aria-label="¿Qué quieres contar?"
        className="w-full resize-none border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground/60"
      />

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="sr-only">Mencionar a</span>
          {suggestions.map((mention) => (
            <button
              key={mention.id}
              type="button"
              onClick={() => insertMention(mention.name)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              @{mention.name}
            </button>
          ))}
        </div>
      ) : null}

      {pollCount > 0 ? (
        <fieldset
          id={pollId}
          className="flex flex-col gap-2 rounded-xl border border-border/70 p-3"
        >
          <legend className="sr-only">Encuesta</legend>
          {Array.from({ length: pollCount }, (_value, index) => (
            <input
              key={index}
              name="pollOption"
              maxLength={80}
              placeholder={`Opción ${index + 1}`}
              aria-label={`Opción ${index + 1} de la encuesta`}
              className={fieldClass}
            />
          ))}
          <div className="flex items-center justify-between">
            {pollCount < POLL_MAX ? (
              <button
                type="button"
                onClick={() => setPollCount((count) => count + 1)}
                className="text-xs font-medium text-emerald-300 hover:underline"
              >
                Añadir opción
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setPollCount(0)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Quitar encuesta
            </button>
          </div>
        </fieldset>
      ) : null}

      {schedule ? (
        <div id={scheduleId} className="flex flex-wrap items-center gap-2">
          <input
            name="publishAt"
            type="datetime-local"
            aria-label="Programar la publicación"
            className={`${fieldClass} w-auto`}
          />
          <button
            type="button"
            onClick={() => setSchedule(false)}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Quitar programación
          </button>
        </div>
      ) : null}

      <details className="group rounded-xl border border-border/60 px-3 py-2">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <IconChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          Más opciones
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="title" label="Título (opcional)" placeholder="Resumen de una línea" />
            <Input name="linkUrl" label="Enlace (opcional)" type="url" placeholder="https://…" />
          </div>
          <Input
            name="mediaUrl"
            label="Vídeo de YouTube o Vimeo"
            placeholder="https://youtu.be/…"
          />
          <Input
            id={altId}
            name="mediaAlt"
            label="Texto alternativo del medio"
            placeholder="Describe la imagen (lectores de pantalla)"
          />
          <Input
            id={tagsId}
            name="tags"
            label="Etiquetas"
            placeholder={`#sub17 #portero (máx. ${POST_TAGS_MAX})`}
          />
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor={typeId} className="text-sm font-medium">
                Tipo
              </label>
              <select
                id={typeId}
                name="type"
                defaultValue="ANNOUNCEMENT"
                className={`${fieldClass} w-auto`}
              >
                <option value="ANNOUNCEMENT">{POST_TYPE_LABELS.ANNOUNCEMENT}</option>
                <option value="ACHIEVEMENT">{POST_TYPE_LABELS.ACHIEVEMENT}</option>
              </select>
              <span className="text-xs text-muted-foreground">
                Con foto o vídeo se clasifica solo.
              </span>
            </div>
          </div>
        </div>
      </details>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <div className="flex items-center gap-1">
          <label htmlFor={fileId} className={toolClass} title="Foto o vídeo">
            <IconImage className="h-4 w-4" />
            <span className="sr-only">Foto o vídeo</span>
          </label>
          <input
            id={fileId}
            name="file"
            type="file"
            accept="image/*,video/*"
            aria-describedby={fileHintId}
            className="sr-only"
          />
          <p id={fileHintId} className="sr-only">
            Imágenes JPG, PNG o WebP de hasta 4 MB, o vídeos MP4, WebM o MOV de hasta 25 MB. Para
            vídeos largos, mejor el enlace en «Más opciones».
          </p>

          <label htmlFor={galleryId} className={toolClass} title="Galería de imágenes">
            <IconImages className="h-4 w-4" />
            <span className="sr-only">Galería de imágenes</span>
          </label>
          <input
            id={galleryId}
            name="files"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
          />

          <button
            type="button"
            onClick={() => setPollCount((count) => (count === 0 ? POLL_START : 0))}
            aria-expanded={pollCount > 0}
            aria-controls={pollId}
            title="Encuesta"
            className={toolClass}
          >
            <IconChart className="h-4 w-4" />
            <span className="sr-only">Encuesta</span>
          </button>

          <button
            type="button"
            onClick={() => setSchedule((value) => !value)}
            aria-expanded={schedule}
            aria-controls={scheduleId}
            title="Programar"
            className={toolClass}
          >
            <IconCalendar className="h-4 w-4" />
            <span className="sr-only">Programar</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {nearLimit ? (
            <span
              className={`text-xs ${body.length >= POST_BODY_MAX ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {body.length}/{POST_BODY_MAX}
            </span>
          ) : null}
          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="ghost"
            disabled={pending}
            title="Guardar como borrador"
          >
            Borrador
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Publicando…' : 'Publicar'}
          </Button>
        </div>
      </div>
    </form>
  );
}
