import Link from 'next/link';
import Image from 'next/image';
import { IconArrowRight, IconCalendar, IconMapPin, IconTicket } from './icons';

export function FeaturedEvent() {
  return (
    <section className="border-y border-white/[0.06] bg-[#0e1310] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e0c]">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Limited spots · 27–29 September
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Train with a Matilda — Chloe Logarzo
              </h2>
              <p className="mt-2 text-sm font-medium text-emerald-400/90">
                Matildas Midfielder · Ex-Professional Footballer
              </p>
              <p className="mt-5 text-base leading-relaxed text-white/60">
                This September, Chloe visits Ballarat Grammar to deliver an elite football
                masterclass — her first visit to Ballarat. Players aged 12–18 take part in
                high-intensity sessions designed to accelerate technical skills, tactical
                understanding and mental resilience. Chloe coaches in small groups and works with
                every player individually.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <p className="flex items-center gap-2 text-sm text-white/60">
                  <IconMapPin className="h-4 w-4 text-emerald-400/70" /> Ballarat Grammar
                </p>
                <p className="flex items-center gap-2 text-sm text-white/60">
                  <IconCalendar className="h-4 w-4 text-emerald-400/70" /> 10am–3pm · 3 days
                </p>
                <p className="flex items-center gap-2 text-sm text-white/60">
                  <IconTicket className="h-4 w-4 text-emerald-400/70" /> $385 AUD
                </p>
              </div>
              <p className="mt-4 text-xs text-white/40">
                Bring a packed lunch each day · In association with PitchUp
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
                >
                  Buy ticket <IconArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 px-6 py-3 text-base font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5"
                >
                  Ask a question
                </Link>
              </div>
            </div>

            <div className="relative min-h-[280px] overflow-hidden border-t border-white/10 lg:border-l lg:border-t-0">
              <Image
                src="/images/football-03.jpg"
                alt="Elite football training session"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e0c] via-[#0a0e0c]/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0a0e0c]/50" />
              <div className="absolute bottom-6 left-6 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                Ballarat Grammar · 3 days
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}