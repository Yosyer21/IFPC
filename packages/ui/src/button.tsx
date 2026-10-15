import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  /** `sm` para acciones secundarias y barras compactas (móvil). */
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full font-semibold transition-all disabled:pointer-events-none disabled:opacity-50';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  const variants = {
    primary: 'bg-brand text-ink shadow-lg shadow-brand/20 hover:brightness-105 active:scale-[0.99]',
    outline: 'border border-border bg-white/5 hover:bg-white/10',
    ghost: 'hover:bg-muted',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  );
}
