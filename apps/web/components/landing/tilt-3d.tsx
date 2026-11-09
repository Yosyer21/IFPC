'use client';

import { useRef, type ReactNode } from 'react';

/**
 * Inclinación 3D al pasar/enfocar el puntero, con un brillo (glare) que sigue al
 * cursor. Se desactiva en táctil y con «reducir movimiento». Sin dependencias.
 */
export function Tilt3D({
  children,
  className = '',
  max = 9,
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const disabled = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (event: React.PointerEvent) => {
    if (event.pointerType === 'touch' || disabled()) return;
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - py) * max * 2;
    const rotateY = (px - 0.5) * max * 2;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      element.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale})`;
      element.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
      element.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
      element.style.setProperty('--glare-o', '1');
    });
  };

  const reset = () => {
    const element = ref.current;
    if (!element || frame.current === null) {
      if (element) element.style.setProperty('--glare-o', '0');
      return;
    }
    cancelAnimationFrame(frame.current);
    element.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    element.style.setProperty('--glare-o', '0');
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
        style={{
          opacity: 'var(--glare-o, 0)',
          background:
            'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.28), transparent 42%)',
        }}
      />
    </div>
  );
}
