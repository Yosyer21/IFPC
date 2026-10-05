import Image from 'next/image';

const SIZES = {
  sm: { box: 'h-9 w-9 text-sm', px: 36 },
  md: { box: 'h-12 w-12 text-base', px: 48 },
  lg: { box: 'h-16 w-16 text-xl', px: 64 },
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
      className={`${box} flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20`}
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
