'use client';

import { useFormStatus } from 'react-dom';

/**
 * Botón de envío de una server action: muestra el estado pendiente y, si se
 * indica, pide confirmación antes de enviar (acciones destructivas).
 */
export function ActionSubmit({
  label,
  pendingLabel = '…',
  confirmText,
  variant = 'outline',
  className = '',
}: {
  label: string;
  pendingLabel?: string;
  /** Si se indica, se pide confirmación con este texto. */
  confirmText?: string;
  variant?: 'outline' | 'primary' | 'danger' | 'ghost';
  className?: string;
}) {
  const { pending } = useFormStatus();

  const styles = {
    outline:
      'border border-border bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
    primary: 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 text-emerald-950',
    danger: 'text-destructive hover:bg-destructive/10',
    ghost: 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
  };

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={
        confirmText
          ? (event) => {
              if (!window.confirm(confirmText)) event.preventDefault();
            }
          : undefined
      }
      className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
