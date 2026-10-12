import type { ReactNode } from 'react';
import Image from 'next/image';
import { profileAccentColors, profileOpenToLabels } from '@ifpc/config';
import { PlayerAvatar } from '@/components/player/avatar';

export interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  /** `User.image`. */
  imageUrl?: string | null;
  /** `Player.bannerUrl`: portada subida por el player. */
  bannerUrl?: string | null;
  /** `Player.accentColor`: tiñe anillo, chips y headline. */
  accentColor?: string | null;
  headline?: string | null;
  location?: string | null;
  /** Línea bajo el nombre (position · level, en el perfil; solo position en público). */
  subtitle?: string | null;
  /** `Player.openTo`: señales de disponibilidad. */
  openTo?: string[];
  /** Badges de estado (se pintan bajo la cabecera). */
  badges?: ReactNode;
  /** Botones de la derecha (estado, editar…). */
  actions?: ReactNode;
  /** Chips sobre la portada para cambiarla (solo el dueño del perfil). */
  coverEditor?: ReactNode;
  /** Chips para cambiar la foto de perfil (solo el dueño). */
  photoEditor?: ReactNode;
}

/**
 * Cabecera personalizable del perfil: portada (o degradado del acento),
 * avatar con anillo del acento, headline, ubicación y chips de «abierto a»,
 * con hueco para cambiar la portada y la foto sin salir de la página.
 * La comparten el perfil propio, el muro de Discovery y el público.
 */
export function ProfileHeader({
  firstName,
  lastName,
  imageUrl,
  bannerUrl,
  accentColor,
  headline,
  location,
  subtitle,
  openTo = [],
  badges,
  actions,
  coverEditor,
  photoEditor,
}: ProfileHeaderProps) {
  const accent = profileAccentColors(accentColor);
  const chips = profileOpenToLabels(openTo);

  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div
        className="relative h-32 w-full sm:h-40"
        style={{ background: `linear-gradient(135deg, ${accent.soft}, transparent 65%)` }}
      >
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt=""
            width={1200}
            height={300}
            unoptimized
            priority
            className="h-full w-full object-cover"
          />
        ) : null}
        {coverEditor ? (
          <div className="absolute inset-x-3 bottom-3 flex justify-end">{coverEditor}</div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5">
        <div className="flex min-w-0 flex-wrap items-end gap-4">
          <div
            className="-mt-10 rounded-full p-1"
            style={{ backgroundColor: accent.hex, boxShadow: `0 0 32px -10px ${accent.hex}` }}
          >
            <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={imageUrl} size="lg" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {firstName} {lastName}
            </h1>
            {headline ? (
              <p className="mt-0.5 text-sm font-medium" style={{ color: accent.hex }}>
                {headline}
              </p>
            ) : null}
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            {location ? <p className="text-xs text-muted-foreground">{location}</p> : null}
            {chips.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((label) => (
                  <li
                    key={label}
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      borderColor: accent.hex,
                      backgroundColor: accent.soft,
                      color: accent.hex,
                    }}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            ) : null}
            {photoEditor ? <div className="mt-2">{photoEditor}</div> : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>

      {badges ? <div className="px-5 pb-5">{badges}</div> : null}
    </div>
  );
}
