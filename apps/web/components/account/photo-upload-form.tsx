'use client';

import { useActionState, useId } from 'react';
import { removeProfilePhotoAction, updateProfilePhotoAction } from '@/app/actions/account';
import { Button } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import { nameParts } from '@/lib/names';

export interface PhotoUploadFormProps {
  /** Nombre completo; se usan las iniciales como respaldo de la foto. */
  name: string;
  imageUrl?: string | null;
  /** Página a la que volver tras guardar (el servidor valida que sea interna). */
  redirectTo?: string;
}

/** Cambia (o quita) la foto de perfil (`User.image`). Válido para **cualquier rol**. */
export function PhotoUploadForm({ name, imageUrl, redirectTo }: PhotoUploadFormProps) {
  const [state, formAction, pending] = useActionState(updateProfilePhotoAction, {});
  const inputId = useId();
  const { firstName, lastName } = nameParts(name);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
      <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={imageUrl} size="lg" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          Image
        </label>
        <input
          id={inputId}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
        />
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max. 2 MB</p>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Uploading…' : 'Save photo'}
          </Button>
          {imageUrl ? (
            <button
              type="submit"
              formAction={removeProfilePhotoAction}
              formNoValidate
              className="text-xs text-muted-foreground underline transition-colors hover:text-destructive"
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
