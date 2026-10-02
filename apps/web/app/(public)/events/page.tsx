import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { IconArrowRight, IconCalendar, IconMapPin, IconTicket } from '@/components/landing/icons';

export const metadata: Metadata = {
  title: 'Events — Future Buller',
  description: 'Train with a Matilda — elite football masterclasses with international players.',
};

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Events</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Train with a Matilda</h1>
          <p className="mt-4 max-w-2xl text-white/55">
            Rare access to elite coaching from current and former international players.
          </p>
        </div>

        <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#101512]">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Limited spots · 27–29 September
              </span>
              <h2 className="mt-5 text-2xl font-bold text-white">
                Train with a Matilda — Chloe Logarzo
              </h2>
              <p className="mt-2 text-sm font-medium text-emerald-400/90">
                Matildas Midfielder · Ex-Professional Footballer
              </p>
              <p className="mt-5 text-sm leading-relaxed text-white/60">
                This September, Chloe visits Ballarat Grammar to deliver an elite football
                masterclass — her first visit to Ballarat. Players aged 12–18 take part in
                high-intensity sessions designed to accelerate technical skills, tactical
                understanding and mental resilience.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
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

              <div className="mt-7">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
                >
                  Buy ticket <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[220px] border-t border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_60%)] lg:border-l lg:border-t-0">
              <div className="absolute inset-0 flex items-center justify-center text-7xl font-black tracking-tight text-white/5">
                CL
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}