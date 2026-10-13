'use client';

import { useActionState, useId } from 'react';
import { removeClubLogoAction, updateClubLogoAction } from '@/app/actions/club';

export interface ClubLogoEditorProps {
  /** ¿Hay escudo ya? Si lo hay, se ofrece quitarlo. */
  hasLogo: boolean;
  /** Página a la que volver tras guardar (el servidor valida que sea interna). */
  redirectTo?: string;
}

/**
 * Chips para cambiar o quitar el escudo **desde la cabecera del perfil**. El
 * fichero se envía solo al elegirlo (mismo patrón que la portada).
 */
export function ClubLogoEditor({ hasLogo, redirectTo }: ClubLogoEditorProps) {
  const [state, formAction, pending] = useActionState(updateClubLogoAction, {});
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
          {pending ? 'Uploading…' : 'Change crest'}
        </label>
      </form>
      {hasLogo ? (
        <form action={removeClubLogoAction}>
          <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
          <button type="submit" className={chip}>
            Remove crest
          </button>
        </form>
      ) : null}
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </div>
  );
}
