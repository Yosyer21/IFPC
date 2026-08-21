'use client';

import { useActionState } from 'react';
import { uploadVideoAction } from '@/app/actions/player';
import { Button, Input } from '@future-buller/ui';

export function VideoUploadForm() {
  const [state, formAction, pending] = useActionState(uploadVideoAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input name="title" label="Título del vídeo" placeholder="Ej: Highlights vs ..." required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="file" className="text-sm font-medium">
          Archivo de vídeo
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="video/*"
          required
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Subiendo…' : 'Subir vídeo'}
      </Button>
    </form>
  );
}
