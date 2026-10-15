import Image from 'next/image';

const SIZES = {
  sm: { box: 'h-9 w-9 text-sm', px: 36 },
  md: { box: 'h-12 w-12 text-base', px: 48 },
  // En móvil el avatar grande se queda en 48px para que la cabecera no ocupe pantalla.
  lg: { box: 'h-12 w-12 text-base sm:h-16 sm:w-16 sm:text-xl', px: 64 },
} as const;

/**
 * Player avatar: profile photo when available, initials otherwise.
 * Only local photos (`/uploads/...`) are rendered; anything else falls back to initials.
 */
export function PlayerAvatar({
  firstName,
  lastName,
  imageUrl,
  size = 'md',
}: {
  firstName?: string;
  lastName?: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials = `${firstName?.trim()[0] ?? ''}${lastName?.trim()[0] ?? ''}`.toUpperCase() || '?';
  const { box, px } = SIZES[size];
  const photo = imageUrl?.startsWith('/') ? imageUrl : null;

  return (
    <div
      className={`${box} flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-panel to-ink font-bold text-brand shadow-lg shadow-brand/25 ring-2 ring-brand/40`}
      aria-hidden="true"
    >
      {photo ? (
        <Image
          src={photo}
          alt=""
          width={px}
          height={px}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
