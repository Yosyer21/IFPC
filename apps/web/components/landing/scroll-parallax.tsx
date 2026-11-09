'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Desplaza el contenido en Y según su posición en el viewport (parallax suave),
 * con `translate3d` para que lo haga la GPU. Respeta «reducir movimiento».
 */
export function ScrollParallax({
  children,
  speed = 0.15,
  className = '',
}: {
  children: ReactNode;
  /** Positivo = se mueve más despacio (queda atrás); negativo = más rápido. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
        element.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
