import Link from 'next/link';
import Image from 'next/image';
import { IconArrowRight, IconCalendar, IconMapPin, IconTicket } from './icons';

export function FeaturedEvent() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
          <Image
            src="/images/football-03.jpg"
            alt="Elite football training session"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b09] via-[#070b09]/90 to-[#070b09]/40" />
          <div className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-emerald-500/25 blur-[130px]" />

          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                Limited spots · 27–29 September
              </span>
              <h2 className="mt-5 text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
                Train with a Matilda — Chloe Logarzo
              </h2>
              <p className="mt-3 text-sm font-semibold text-emerald-400/90">
                Matildas Midfielder · Ex-Professional Footballer
              </p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
                This September, Chloe visits Ballarat Grammar to deliver an elite football
                masterclass — her first visit to Ballarat. Players aged 12–18 take part in
                high-intensity sessions designed to accelerate technical skills, tactical
                understanding and mental resilience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/events"
                  className="glow inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-7 py-3.5 text-base font-bold text-emerald-950 transition-transform hover:scale-[1.03]"
                >
                  Buy ticket <IconArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  Ask a question
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 lg:items-end lg:justify-end">
              <div className="relative h-80 w-64 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src="/images/chloe-logarzo.jpg"
                  alt="Chloe Logarzo, Matildas midfielder"
                  fill
                  sizes="256px"
                  className="object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070b09] via-[#070b09]/70 to-transparent p-4">
                  <p className="text-sm font-bold text-white">Chloe Logarzo</p>
                  <p className="text-xs font-semibold text-emerald-400">Matildas · Midfielder</p>
                </div>
              </div>
              <div className="glass grid w-full grid-cols-1 gap-4 rounded-2xl p-6 sm:grid-cols-3 lg:w-auto">
                <div>
                  <IconMapPin className="h-5 w-5 text-emerald-400" />
                  <p className="mt-2 text-xs uppercase tracking-wider text-white/45">Venue</p>
                  <p className="text-sm font-semibold text-white">Ballarat Grammar</p>
                </div>
                <div>
                  <IconCalendar className="h-5 w-5 text-emerald-400" />
                  <p className="mt-2 text-xs uppercase tracking-wider text-white/45">Dates</p>
                  <p className="text-sm font-semibold text-white">10am–3pm · 3 days</p>
                </div>
                <div>
                  <IconTicket className="h-5 w-5 text-emerald-400" />
                  <p className="mt-2 text-xs uppercase tracking-wider text-white/45">Price</p>
                  <p className="text-sm font-semibold text-white">$385 AUD</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}