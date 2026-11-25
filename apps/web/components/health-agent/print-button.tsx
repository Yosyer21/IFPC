'use client';

/** "Download as PDF": abre el diálogo de impresión del navegador (Guardar como PDF). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03] print:hidden"
    >
      Download as PDF
    </button>
  );
}
