import type { HTMLAttributes } from 'react';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({
  src,
  alt = '',
  initials,
  size = 'md',
  className = '',
  ...props
}: AvatarProps) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const fallback = initials ?? (alt ? alt.charAt(0).toUpperCase() : '?');
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/25 to-lime-500/15 font-semibold text-emerald-300 ring-1 ring-emerald-500/25 ${sizes[size]} ${src ? 'bg-cover bg-center' : ''} ${className}`}
      style={src ? { backgroundImage: `url(${src})` } : undefined}
      {...props}
    >
      {src ? null : fallback}
    </span>
  );
}
