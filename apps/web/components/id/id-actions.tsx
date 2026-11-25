'use client';

import { useState } from 'react';

/**
 * Acciones compartidas de una página ID: descargar como PDF (impresión del
 * navegador) y compartir el enlace (Web Share API o copiar al portapapeles).
 */
export function IdActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Compartir cancelado por el usuario.
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
      >
        Download as PDF
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
      >
        {copied ? 'Link copied' : 'Share ID'}
      </button>
    </div>
  );
}
