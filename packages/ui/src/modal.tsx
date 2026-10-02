'use client';

import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-in w-full max-w-lg rounded-2xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {title ? <h2 className="mb-4 text-lg font-semibold">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
