'use client';

import { useActionState } from 'react';
import { updatePlayerPhotoAction } from '@/app/actions/player';
import { Button } from '@ifpc/ui';
import { PlayerAvatar } from './avatar';

/** Uploads the profile photo shown by `PlayerAvatar` (stored as `User.image`). */
export function PhotoUploadForm({
  firstName,
  lastName,
  imageUrl,
}: {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
}) {
  const [state, formAction, pending] = useActionState(updatePlayerPhotoAction, {});

  return (
    <form action={formAction} className="flex w-full flex-col items-center gap-3">
      <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={imageUrl} size="lg" />
      <input
        id="photo"
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
      />
      <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 2 MB</p>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Subiendo…' : 'Guardar foto'}
      </Button>
    </form>
  );
}
