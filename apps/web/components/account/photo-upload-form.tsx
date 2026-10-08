'use client';

import { useActionState, useId } from 'react';
import { updateProfilePhotoAction } from '@/app/actions/account';
import { Button } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import { nameParts } from '@/lib/names';

export interface PhotoUploadFormProps {
  /** Nombre completo; se usan las iniciales como respaldo de la foto. */
  name: string;
  imageUrl?: string | null;
  /** Página a la que volver tras guardar (el servidor valida que sea interna). */
  redirectTo?: string;
  /** Versión reducida, para el sidebar. */
  compact?: boolean;
}

/** Cambia la foto de perfil (`User.image`). Válido para **cualquier rol**. */
export function PhotoUploadForm({
  name,
  imageUrl,
  redirectTo,
  compact = false,
}: PhotoUploadFormProps) {
  const [state, formAction, pending] = useActionState(updateProfilePhotoAction, {});
  const inputId = useId();
  const { firstName, lastName } = nameParts(name);

  return (
    <form action={formAction} className="flex w-full flex-col items-center gap-3">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
      <PlayerAvatar
        firstName={firstName}
        lastName={lastName}
        imageUrl={imageUrl}
        size={compact ? 'md' : 'lg'}
      />
      {compact ? null : (
        <label htmlFor={inputId} className="self-start text-sm font-medium">
          Foto
        </label>
      )}
      <input
        id={inputId}
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
      />
      {compact ? null : (
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 2 MB</p>
      )}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className={compact ? 'text-xs' : undefined}>
        {pending ? 'Subiendo…' : 'Guardar foto'}
      </Button>
    </form>
  );
}
