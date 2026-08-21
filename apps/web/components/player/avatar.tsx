export function PlayerAvatar({
  firstName,
  lastName,
  size = 'md',
}: {
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials = `${firstName?.trim()[0] ?? ''}${lastName?.trim()[0] ?? ''}`.toUpperCase() || '?';
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl',
  };

  return (
    <div
      className={`${sizes[size]} flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
