'use client';

import { useActionState, useId } from 'react';
import { removeClubBannerAction, updateClubBannerAction } from '@/app/actions/club';

export interface ClubCoverEditorProps {
  /** ¿Hay portada ya? Si la hay, se ofrece quitarla. */
  hasBanner: boolean;
  /** Página a la que volver tras guardar (el servidor valida que sea interna). */
  redirectTo?: string;
}

/**
 * Chips para cambiar o quitar la portada del club **desde la cabecera del
 * perfil**, sin pasar por el formulario de edición. El fichero se envía solo al
 * elegirlo (mismo patrón que la portada del jugador).
 */
export function ClubCoverEditor({ hasBanner, redirectTo }: ClubCoverEditorProps) {
  const [state, formAction, pending] = useActionState(updateClubBannerAction, {});
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
        <form action={removeClubBannerAction}>
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
