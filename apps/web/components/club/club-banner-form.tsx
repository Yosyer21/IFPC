'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { Button } from '@ifpc/ui';
import { removeClubBannerAction, updateClubBannerAction } from '@/app/actions/club';

export interface ClubBannerFormProps {
  /** Portada actual, si la hay (se muestra como vista previa). */
  imageUrl?: string | null;
  /** Página a la que volver tras guardar (el servidor valida que sea interna). */
  redirectTo?: string;
}

/** Sube o quita la portada del perfil (`Club.bannerUrl`). */
export function ClubBannerForm({ imageUrl, redirectTo }: ClubBannerFormProps) {
  const [state, formAction, pending] = useActionState(updateClubBannerAction, {});

  return (
    <div className="flex flex-col gap-3">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Current cover"
          width={1200}
          height={300}
          unoptimized
          className="h-24 w-full rounded-lg border border-border/60 object-cover"
        />
      ) : null}
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          aria-label="Cover photo"
          className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP · max. 4 MB · cropped horizontally
        </p>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Uploading…' : 'Save cover'}
        </Button>
      </form>
      {imageUrl ? (
        <form action={removeClubBannerAction}>
          <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
          <button type="submit" className="text-xs text-muted-foreground hover:underline">
            Remove cover
          </button>
        </form>
      ) : null}
    </div>
  );
}
