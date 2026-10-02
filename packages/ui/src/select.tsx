'use client';

import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: readonly string[] | { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <label className="text-sm font-medium">{label}</label> : null}
      <select
        className={`h-10 w-full rounded-xl border border-border bg-white/5 px-3 text-sm outline-none transition-colors focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40 ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const text = typeof option === 'string' ? option : option.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </div>
  );
}
