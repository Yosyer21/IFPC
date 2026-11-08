import Link from 'next/link';
import { IconArrowRight } from './icons';
import { SoccerBall3D } from './soccer-ball-3d';

/**
 * Sección de la landing con el balón 3D (WebGL). Fondo oscuro con glow de
 * estadio, sombra de suelo y chips de estado; el balón se puede arrastrar.
 */
export function BallShowcase() {
  return (
    <section className="relative overflow-hidden bg-panel py-16 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-bars-faint-invert opacity-60"
        aria-hidden="true"
      />

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

          <div className="mt-6 flex flex-wrap gap-2">
            {['Interactive 3D', 'WebGL', 'Drag to spin'].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70"
              >
                {chip}
              </span>
            ))}
          </div>

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

        <div className="relative flex items-center justify-center py-10">
          {/* Glow de estadio */}
          <div
            className="pointer-events-none absolute h-[26rem] w-[26rem] rounded-full bg-brand/25 blur-[120px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute h-40 w-40 rounded-full bg-white/10 blur-[80px]"
            aria-hidden="true"
          />
          {/* Sombra de suelo */}
          <div
            className="fb-ball-shadow pointer-events-none absolute bottom-3 h-6 w-60 rounded-[100%] bg-black/60 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative aspect-square w-64 sm:w-96">
            <SoccerBall3D className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
