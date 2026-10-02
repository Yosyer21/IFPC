import Link from 'next/link';
import Image from 'next/image';
import { IconArrowRight } from './icons';

function Dot({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} aria-hidden="true" />;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/45">{label}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background photo + overlays */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/football-01.jpg"
          alt="Young footballers competing for the ball on the pitch"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e0c]/70 via-[#0a0e0c]/85 to-[#0a0e0c]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e0c] via-[#0a0e0c]/75 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(255,255,255,0.6) 0 1px, transparent 1px 64px)',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 sm:pb-32 sm:pt-48">
        <div className="max-w-2xl animate-fade-up">
          <div className="mb-6 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/90">
            <Dot className="bg-emerald-500" />
            Empowering girls aged 10–18
          </div>

          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            The World of{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-lime-400 bg-clip-text text-transparent">
              Future Buller
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            We want to build an environment where young girls thrive — a space to build their
            knowledge, confidence and self-belief.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/activities"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3 text-base font-semibold text-emerald-950 transition-transform hover:scale-[1.02]"
            >
              Explore activities <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 bg-white/5 px-6 py-3 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10"
            >
              Train with a Matilda
            </Link>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <Stat value="10–18" label="Ages welcome" />
            <Stat value="All" label="Abilities" />
            <Stat value="Matildas" label="Coaching" />
          </div>
        </div>
      </div>
    </section>
  );
}