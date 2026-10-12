'use client';

import { useActionState, useId } from 'react';
import { removeProfilePhotoAction, updateProfilePhotoAction } from '@/app/actions/account';

export interface ProfilePhotoEditorProps {
  /** ¿Hay foto ya? Si la hay, se ofrece quitarla. */
  hasImage: boolean;
  /** Página a la que volver tras guardar (el servidor valida que sea interna). */
  redirectTo?: string;
}

/**
 * Chips para cambiar o quitar la foto de perfil **desde la cabecera del perfil**.
 * El fichero se envía solo al elegirlo (mismo patrón que la portada).
 */
export function ProfilePhotoEditor({ hasImage, redirectTo }: ProfilePhotoEditorProps) {
  const [state, formAction, pending] = useActionState(updateProfilePhotoAction, {});
  const inputId = useId();
  const chip =
    'rounded-full border border-border bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={formAction} className="contents">
        <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
        <input
          id={inputId}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        />
        <label htmlFor={inputId} className={`cursor-pointer ${chip}`}>
          {pending ? 'Uploading…' : 'Change photo'}
        </label>
      </form>
      {hasImage ? (
        <form action={removeProfilePhotoAction}>
          <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
          <button type="submit" className={chip}>
            Remove photo
          </button>
        </form>
      ) : null}
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </div>
  );
}
