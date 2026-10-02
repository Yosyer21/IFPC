import Link from 'next/link';
import { IconBook, IconCheck } from './icons';

const LEARN = [
  'Set clear goals',
  'Stay confident after tough games',
  'Build strong daily habits',
  'Stay motivated through setbacks',
];

export function FeaturedProduct() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex justify-center">
            <div className="flex h-72 w-56 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[#101512] to-[#0a0e0c]">
              <IconBook className="h-16 w-16 text-emerald-400/80" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Mindset journal
              </span>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
              Mindset tool
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Future Buller Planner
            </h2>
            <p className="mt-2 text-sm font-medium text-white/60">Train your mind like a Matilda</p>

            <div className="mt-5 flex items-center gap-3">
              <span className="text-2xl font-bold text-white">$29.99</span>
              <span className="text-lg text-white/40 line-through">$49.99</span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                40% OFF
              </span>
            </div>

            <p className="mt-5 text-base leading-relaxed text-white/60">
              More than a notebook — a mindset training tool created with guidance from Chloe
              Logarzo and Emily Gielnik, built on the same principles elite players use at the
              highest level.
            </p>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {LEARN.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                  <IconCheck className="h-4 w-4 text-emerald-400" /> {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs text-white/40">
              Dispatched within 2 business days · Australia Post flat rate $14.95.
            </p>

            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
              >
                Buy the planner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}