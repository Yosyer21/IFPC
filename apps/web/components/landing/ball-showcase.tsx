import Link from 'next/link';
import { IconArrowRight } from './icons';
import { SoccerBall } from './soccer-ball';

/**
 * Sección de la landing con un espacio dedicado al balón de fútbol 3D. Fondo
 * oscuro (panel) para que el balón destaque; el movimiento 3D y la sombra vienen
 * de `.fb-ball-3d` / `.fb-ball-shadow` (globals.css).
 */
export function BallShowcase() {
  return (
    <section className="relative overflow-hidden bg-panel py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-bars-faint-invert opacity-60" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">The game starts here</p>
          <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
            One ball.
            <br />
            <span className="text-gradient">Infinite futures.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
            Every journey begins the moment a girl first touches the ball. Our development
            environment turns that spark into skill, confidence and international opportunity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-ink transition-colors hover:brightness-95"
            >
              Start your journey <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/camps"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explore camps
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center py-6">
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full bg-brand/20 blur-[90px]"
            aria-hidden="true"
          />
          <div
            className="fb-ball-shadow pointer-events-none absolute bottom-4 h-6 w-52 rounded-full bg-black/60 blur-2xl"
            aria-hidden="true"
          />
          <div className="fb-ball-3d relative w-60 sm:w-80">
            <SoccerBall className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
