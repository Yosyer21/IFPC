import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    primary:
      'bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 text-emerald-950 shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-[0.99]',
    outline: 'border border-border bg-white/5 hover:bg-white/10',
    ghost: 'hover:bg-muted',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
