'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ifpc/ui';
import { addFilmClipNoteAction } from '@/app/actions/film-room';

export function FilmClipNoteForm({ clipId }: { clipId: string }) {
  const [state, formAction, pending] = useActionState(addFilmClipNoteAction, {});

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="clipId" value={clipId} />
      <Input name="timestamp" label="Timestamp (mm:ss)" placeholder="0:42" defaultValue="0:00" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`note-${clipId}`} className="text-sm font-medium">
          Feedback
        </label>
        <textarea
          id={`note-${clipId}`}
          name="body"
          rows={2}
          required
          placeholder="Open your hips a little more before the ball arrives."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-[#4f6b0a]">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Add feedback'}
      </Button>
    </form>
  );
}
