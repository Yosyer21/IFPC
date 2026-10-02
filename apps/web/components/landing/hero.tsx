import Link from 'next/link';
import { IconArrowRight, IconCalendar, IconMapPin, IconStar } from './icons';

function Dot({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} aria-hidden="true" />;
}

function EventCard() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#101512] p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <Dot className="bg-emerald-500" /> Limited spots
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/45">27–29 Sept</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">Train with a Matilda</h3>
      <p className="text-sm text-white/55">Chloe Logarzo · Matildas Midfielder</p>
      <div className="mt-5 space-y-2 text-sm text-white/60">
        <p className="flex items-center gap-2">
          <IconMapPin className="h-4 w-4 text-white/40" /> Ballarat Grammar
        </p>
        <p className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-white/40" /> 2026 · 10am–3pm · 3 days
        </p>
        <p className="flex items-center gap-2">
          <IconStar className="h-4 w-4 text-white/40" /> Ages 12–18 · small groups
        </p>
      </div>
      <Link
        href="/events"
        className="mt-5 flex items-center gap-1 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
      >
        See the event <IconArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function FoundersBadge() {
  return (
    <div className="mt-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#101512] px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-white/45">Led by Matildas</p>
      <p className="mt-1 text-sm text-white/70">
        Chloe Logarzo &amp; Emily Gielnik attend every camp.
      </p>
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
            Empowering girls aged 10–18
          </div>

          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
            The World of <span className="text-emerald-400">Future Buller</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/55">
            We want to build an environment where young girls thrive — a space to build their
            knowledge, confidence and self-belief.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/activities"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
            >
              Explore activities <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-6 py-3 text-base font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5"
            >
              Train with a Matilda
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-white/45">
            <span className="flex items-center gap-2">
              <Dot className="bg-emerald-500" /> Open to all abilities
            </span>
            <span className="flex items-center gap-2">
              <Dot className="bg-emerald-500" /> Elite coaches
            </span>
            <span className="flex items-center gap-2">
              <Dot className="bg-emerald-500" /> Mindset &amp; leadership
            </span>
          </div>
        </div>

        <div className="flex animate-fade-up-slow flex-col items-center lg:items-end">
          <EventCard />
          <FoundersBadge />
        </div>
      </div>
    </section>
  );
}