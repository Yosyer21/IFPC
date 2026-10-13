import Image from 'next/image';

const SIZES = {
  sm: { box: 'h-9 w-9 text-sm', px: 36 },
  md: { box: 'h-12 w-12 text-base', px: 48 },
  lg: { box: 'h-16 w-16 text-xl', px: 64 },
} as const;

/**
 * Escudo del club: el logo cuando existe y las iniciales del nombre si no.
 * Solo se pintan los ficheros locales (`/uploads/...`); cualquier otra URL cae a
 * las iniciales, igual que hace `PlayerAvatar` con la foto del jugador.
 */
export function ClubLogo({
  name,
  logoUrl,
  size = 'md',
}: {
  name?: string | null;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials =
    (name ?? '')
      .trim()
      .split(/\s+/)
      .map((word) => word[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  const { box, px } = SIZES[size];
  const photo = logoUrl?.startsWith('/') ? logoUrl : null;

  return (
    <div
      className={`${box} flex shrink-0 select-none items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20`}
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
