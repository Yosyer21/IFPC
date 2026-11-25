'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import { createFilmClipAction } from '@/app/actions/film-room';
import { FILM_CLIP_CATEGORIES, FILM_CLIP_CATEGORY_LABELS } from '@/lib/film-room';

const CATEGORY_OPTIONS = FILM_CLIP_CATEGORIES.map((value) => ({
  value,
  label: FILM_CLIP_CATEGORY_LABELS[value],
}));

export function FilmClipForm() {
  const [state, formAction, pending] = useActionState(createFilmClipAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        name="title"
        label="Clip title"
        placeholder="Weak-foot finishing, last 5 reps"
        required
      />
      <Select
        name="category"
        label="Category"
        options={CATEGORY_OPTIONS}
        defaultValue="ON_THE_BALL"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="question" className="text-sm font-medium">
          Ask your coach
        </label>
        <textarea
          id="question"
          name="question"
          rows={2}
          placeholder="What do you want feedback on?"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="video" className="text-sm font-medium">
          Video (MP4, WebM or MOV)
        </label>
        <input
          id="video"
          name="video"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          required
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold"
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Uploading…' : 'Upload & publish'}
      </Button>
      <p className="text-xs text-muted-foreground">Your clip is also published to Discovery.</p>
    </form>
  );
}
