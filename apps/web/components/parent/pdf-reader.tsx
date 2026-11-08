'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Loader2, Minus, Plus } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Lector de PDF propio: renderiza cada página a un <canvas> con PDF.js dentro de
 * un marco con el estilo de la app (zoom, contador y scroll), de modo que el
 * documento se sienta parte de la página en vez de un visor incrustado.
 */
export function PdfReader({ url, title }: { url: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);

  // Carga del documento (una vez).
  useEffect(() => {
    let cancelled = false;
    let destroyDoc: (() => void) | null = null;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const loadingTask = pdfjs.getDocument({ url });
        destroyDoc = () => {
          void (loadingTask as unknown as { destroy: () => Promise<void> }).destroy();
        };
        const pdfDoc = await loadingTask.promise;
        if (!cancelled) setDoc(pdfDoc);
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      destroyDoc?.();
    };
  }, [url]);

  // Ancho disponible.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Render de páginas cuando cambian documento, ancho o zoom.
  useEffect(() => {
    const container = pagesRef.current;
    if (!doc || !container || width === 0) return;
    let cancelled = false;
    container.replaceChildren();
    setStatus('loading');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    (async () => {
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        if (cancelled) return;
        const page = await doc.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = (width - 4) / baseViewport.width;
        const viewport = page.getViewport({ scale: fitScale * zoom });
        const canvas = document.createElement('canvas');
        canvas.className = 'mx-auto mb-4 block rounded-lg bg-white shadow-md ring-1 ring-black/5';
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const context = canvas.getContext('2d');
        if (!context) continue;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        container.appendChild(canvas);
        await page.render({ canvasContext: context, canvas, viewport }).promise;
      }
      if (!cancelled) setStatus('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, width, zoom]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Barra superior del lector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden="true" />
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#f59e0b]" aria-hidden="true" />
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
          <span className="ml-2 max-w-40 truncate text-xs font-semibold text-muted-foreground">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {doc ? (
            <span className="mr-1 hidden text-xs font-semibold text-muted-foreground sm:inline">
              {doc.numPages} page{doc.numPages === 1 ? '' : 's'}
            </span>
          ) : null}
          <div className="flex items-center rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="min-w-12 px-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              aria-label="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.6, Math.round((z + 0.2) * 10) / 10))}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Open</span>
          </a>
          <a
            href={url}
            download
            className="flex h-8 items-center gap-1.5 rounded-lg bg-brand px-2.5 text-xs font-semibold text-ink hover:brightness-95"
          >
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* Cuerpo con las páginas */}
      <div ref={wrapRef} className="relative max-h-[80vh] overflow-auto bg-[#eceef1] p-4">
        {status === 'error' ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              We couldn’t display this document inline.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink hover:brightness-95"
            >
              <ExternalLink className="h-4 w-4" /> Open the PDF
            </a>
          </div>
        ) : null}

        {status === 'loading' ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#eceef1]/70">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#4f6b0a]" /> Rendering document…
            </span>
          </div>
        ) : null}

        <div ref={pagesRef} />
      </div>
    </div>
  );
}
