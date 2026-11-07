import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold text-foreground/80">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-ring/40 ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
