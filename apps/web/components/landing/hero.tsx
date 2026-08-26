import Link from 'next/link';
import { IconArrowRight, IconStar, IconVideo } from './icons';

function Dot({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} aria-hidden="true" />;
}

function PlayerCard() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#101512] p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-base font-semibold tracking-wide text-emerald-400">
          CF
        </div>
        <div>
          <p className="text-lg font-semibold text-white">Carlos Fernández</p>
          <p className="text-sm text-white/55">Striker · 17 years · Spain</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-white/75">
        <Dot className="bg-emerald-500" />
        Available for trials
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white/45">Match score</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
            <IconStar className="h-4 w-4" /> 87/100
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[87%] rounded-full bg-emerald-500" />
        </div>
        <p className="mt-2 text-xs text-white/45">Matches “U17 Striker” at Academia Pro</p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <IconVideo className="h-4 w-4 text-white/40" />
          6 videos
        </div>
        <Link
          href="/register?role=PLAYER"
          className="flex items-center gap-1 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          View profile <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Pipeline() {
  const steps = ['Submission', 'Trial', 'Negotiation', 'Contract'];
  return (
    <div className="mt-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#101512] px-5 py-4">
      <p className="mb-3 text-xs uppercase tracking-wider text-white/45">Recruitment pipeline</p>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                {index + 1}
              </span>
              <span className="text-center text-[10px] leading-tight text-white/55">{step}</span>
            </div>
            {index < steps.length - 1 ? (
              <div className="mb-4 h-px flex-1 bg-white/10" aria-hidden="true" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pb-32 sm:pt-40">
      {/* Background: very subtle pitch texture */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(255,255,255,0.6) 0 1px, transparent 1px 64px)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.07),transparent_55%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2">
        <div className="animate-fade-up">
          <div className="mb-6 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/90">
            <Dot className="bg-emerald-500" />
            The global football platform
          </div>

          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Where talent finds{' '}
            <span className="text-emerald-400">its future</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/55">
            Create your player profile, upload your videos and connect with clubs, scouts and
            agents. Professional recruitment, within reach of your talent.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
            >
              Create your free account <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-6 py-3 text-base font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5"
            >
              Browse opportunities
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-white/45">
            <span className="flex items-center gap-2">
              <Dot className="bg-emerald-500" /> Free for players
            </span>
            <span className="flex items-center gap-2">
              <Dot className="bg-emerald-500" /> Verified clubs
            </span>
            <span className="flex items-center gap-2">
              <Dot className="bg-emerald-500" /> Smart matching
            </span>
          </div>
        </div>

        <div className="flex animate-fade-up-slow flex-col items-center lg:items-end">
          <PlayerCard />
          <Pipeline />
        </div>
      </div>
    </section>
  );
}
