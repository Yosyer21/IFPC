'use client';

import { useActionState, useId } from 'react';
import { removeProfileBannerAction, updateProfileBannerAction } from '@/app/actions/player';

export interface CoverPhotoEditorProps {
  /** ¿Hay portada ya? Si la hay, se ofrece quitarla. */
  hasBanner: boolean;
  /** Página a la que volver tras guardar (el servidor valida que sea interna). */
  redirectTo?: string;
}

/**
 * Chips para cambiar o quitar la portada **desde la cabecera del perfil**, sin
 * pasar por el formulario de edición. El fichero se envía solo al elegirlo.
 */
export function CoverPhotoEditor({ hasBanner, redirectTo }: CoverPhotoEditorProps) {
  const [state, formAction, pending] = useActionState(updateProfileBannerAction, {});
  const inputId = useId();
  const chip =
    'rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/70';

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
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
          {pending ? 'Uploading…' : 'Change cover'}
        </label>
      </form>
      {hasBanner ? (
        <form action={removeProfileBannerAction}>
          <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
          <button type="submit" className={chip}>
            Remove cover
          </button>
        </form>
      ) : null}
      {state.error ? (
        <p className="rounded-full bg-destructive/90 px-3 py-1.5 text-xs text-white">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
