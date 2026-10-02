import Link from 'next/link';
import Image from 'next/image';
import { IconArrowRight, IconBall, IconStar } from './icons';

const FACTS = [
  { value: '10–18', label: 'Ages welcome' },
  { value: 'All', label: 'Abilities' },
  { value: 'Matildas', label: 'Led by' },
];

export function Hero() {
  return (
    <section className="relative isolate min-h-[94vh] overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b09]/85 via-[#070b09]/70 to-[#070b09]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b09] via-[#070b09]/55 to-transparent" />
        <div className="absolute -left-20 top-24 h-96 w-96 rounded-full bg-emerald-500/25 blur-[130px]" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-lime-400/15 blur-[130px]" />
      </div>

      <div className="mx-auto flex min-h-[94vh] max-w-7xl flex-col justify-center px-4 pb-16 pt-32 sm:px-6">
        <div className="max-w-3xl animate-fade-up">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            <IconBall className="h-4 w-4" /> Empowering girls aged 10–18
          </span>

          <h1 className="mt-7 text-5xl font-black leading-[0.94] tracking-tight text-white sm:text-7xl lg:text-8xl">
            The World of
            <br />
            <span className="text-gradient">Future Baller</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
            We build an environment where young girls thrive — a space to grow their knowledge,
            confidence and self-belief through football.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/activities"
              className="glow inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-7 py-4 text-base font-bold text-emerald-950 transition-transform hover:scale-[1.03]"
            >
              Explore activities <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <IconStar className="h-4 w-4 text-emerald-400" /> Train with a Matilda
            </Link>
          </div>

          <div className="mt-16 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
            {FACTS.map((fact) => (
              <div key={fact.label} className="glass rounded-2xl px-5 py-4">
                <div className="text-2xl font-black text-white sm:text-3xl">{fact.value}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  {fact.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}