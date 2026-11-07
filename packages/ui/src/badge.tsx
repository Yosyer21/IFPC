import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-brand/20 text-[#4f6b0a]',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    outline: 'border border-border text-muted-foreground',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
