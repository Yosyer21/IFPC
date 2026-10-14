'use client';

import { useActionState } from 'react';
import { createTrainingContentAction, updateTrainingContentAction } from '@/app/actions/training';
import { Button, Input, Select } from '@ifpc/ui';
import { VisibilityFields, defaultVisibility } from '@/components/training/visibility-fields';
import { AudienceFields } from '@/components/training/audience-fields';
import {
  TRAINING_AUTHOR_CATEGORIES,
  TRAINING_CATEGORY_LABELS,
  TRAINING_EQUIPMENT,
  TRAINING_EQUIPMENT_LABELS,
  TRAINING_KINDS,
  TRAINING_KIND_LABELS,
} from '@ifpc/config';

/** Valores con los que se rellena el formulario en modo edición. */
export interface TrainingContentFormValues {
  id: string;
  kind: string;
  category: string;
  title: string;
  description: string | null;
  content: string | null;
  outcomes: string[];
  videoUrl: string | null;
  durationMinutes: number | null;
  difficulty: number | null;
  /** Visibilidad actual (`DRAFT` / `PUBLISHED`). */
  status: string;
  /** Fecha de publicación programada, si la tiene. */
  publishAt: Date | null;
  /** Destinatarios: `AUDIENCE` o `SELECTED`. */
  scope: string;
  /** Jugadores elegidos cuando `scope = SELECTED`. */
  targetPlayerIds: string[];
  /** Ejercicio estructurado (ficha de campo). */
  series: number | null;
  reps: string | null;
  restSeconds: number | null;
  space: string | null;
  players: string | null;
  equipment: string[];
}

export interface TrainingContentFormProps {
  /** Tipo preseleccionado al publicar (la pestaña desde la que se abre). */
  defaultKind?: 'COURSE' | 'EXERCISE';
  /** Si viene, edita ese contenido en vez de crear uno nuevo. */
  content?: TrainingContentFormValues;
  /** Categorías elegibles (por defecto, las de coach/club). */
  categories?: readonly string[];
  /** Jugadores del autor, para poder dirigir el contenido a algunos. */
  players?: { playerId: string; name: string }[];
}

/**
 * Formulario de autoría del Football Center: sirve para **crear** y para
 * **editar**. El autor y el origen siempre los fija el servidor desde la sesión.
 */
export function TrainingContentForm({
  defaultKind = 'EXERCISE',
  content,
  categories = TRAINING_AUTHOR_CATEGORIES,
  players = [],
}: TrainingContentFormProps) {
  const editing = Boolean(content);
  const [state, formAction, pending] = useActionState(
    editing ? updateTrainingContentAction : createTrainingContentAction,
    {}
  );

  const visibilityDefault = defaultVisibility(content);

  const kindOptions = TRAINING_KINDS.map((kind) => ({
    value: kind,
    label: TRAINING_KIND_LABELS[kind],
  }));
  const categoryOptions = categories.map((category) => ({
    value: category,
    label: TRAINING_CATEGORY_LABELS[category] ?? category,
  }));

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {content ? <input type="hidden" name="contentId" value={content.id} /> : null}
      {content ? (
        <Select name="kind" label="Type" options={kindOptions} defaultValue={content.kind} />
      ) : (
        // Al crear desde una pestaña el tipo lo fija la pestaña (cursos o
        // ejercicios): se manda como campo oculto y así no hay ambigüedad.
        <input type="hidden" name="kind" value={defaultKind} />
      )}
      <Select
        name="category"
        label="Category"
        options={categoryOptions}
        defaultValue={content?.category ?? categoryOptions[0]?.value}
      />
      <Input
        name="title"
        label="Title"
        required
        maxLength={140}
        defaultValue={content?.title ?? ''}
      />
      <Input
        name="description"
        label="Short description"
        maxLength={600}
        defaultValue={content?.description ?? ''}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Content or instructions
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          placeholder="Steps, series, repetitions, coaching points…"
          defaultValue={content?.content ?? ''}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="outcomes" className="text-sm font-medium">
          Key points <span className="text-muted-foreground">(one per line)</span>
        </label>
        <textarea
          id="outcomes"
          name="outcomes"
          rows={3}
          defaultValue={content?.outcomes.join('\n') ?? ''}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          name="durationMinutes"
          type="number"
          min={1}
          max={600}
          label="Duration (minutes)"
          defaultValue={content?.durationMinutes ?? ''}
        />
        <Input
          name="difficulty"
          type="number"
          min={1}
          max={5}
          label="Level (1-5)"
          defaultValue={content?.difficulty ?? ''}
        />
      </div>
      <Input
        name="videoUrl"
        label="Video URL"
        placeholder="https://… (or upload a file below)"
        defaultValue={content?.videoUrl ?? ''}
      />

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border/70 p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">
          Exercise details (optional)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="series"
            type="number"
            min={1}
            max={50}
            label="Series"
            defaultValue={content?.series ?? ''}
          />
          <Input
            name="reps"
            label="Reps or time"
            placeholder="10 each side, 4 min…"
            maxLength={60}
            defaultValue={content?.reps ?? ''}
          />
          <Input
            name="restSeconds"
            type="number"
            min={0}
            max={3600}
            label="Rest (seconds)"
            defaultValue={content?.restSeconds ?? ''}
          />
          <Input
            name="space"
            label="Space"
            placeholder="30x20 m, half pitch…"
            maxLength={60}
            defaultValue={content?.space ?? ''}
          />
        </div>
        <Input
          name="players"
          label="Players"
          placeholder="4v4 + 2 neutrals"
          maxLength={60}
          defaultValue={content?.players ?? ''}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Material</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {TRAINING_EQUIPMENT.map((item) => (
              <label key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="equipment"
                  value={item}
                  defaultChecked={content?.equipment.includes(item) ?? false}
                  className="h-3.5 w-3.5 rounded border-border"
                />
                {TRAINING_EQUIPMENT_LABELS[item]}
              </label>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Series, reps, rest, space and material show up in the exercise sheet.
        </p>
      </fieldset>

      <AudienceFields
        players={players}
        defaultScope={content?.scope ?? 'AUDIENCE'}
        selectedPlayerIds={content?.targetPlayerIds ?? []}
      />

      <VisibilityFields defaultValue={visibilityDefault} publishAt={content?.publishAt ?? null} />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : editing ? 'Save changes' : 'Save content'}
      </Button>
    </form>
  );
}
