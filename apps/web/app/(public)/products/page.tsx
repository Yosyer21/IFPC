import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { IconBook, IconCheck } from '@/components/landing/icons';

export const metadata: Metadata = {
  title: 'Products — Future Buller',
  description:
    'The Future Buller Planner — a goal-setting journal to train your mind like a Matilda.',
};

const LEARN = [
  'Set clear goals',
  'Stay confident after tough games',
  'Build strong daily habits',
  'Stay motivated through setbacks',
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Products
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Mindset tools</h1>
          <p className="mt-4 max-w-2xl text-white/55">
            Personal development tools to help young footballers build confidence, discipline and
            belief from day one.
          </p>
        </div>

        <article className="grid gap-8 rounded-2xl border border-white/10 bg-[#101512] p-8 lg:grid-cols-[240px_1fr] lg:p-10">
          <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#101512] to-[#0a0e0c]">
            <IconBook className="h-16 w-16 text-emerald-400/80" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Future Buller Planner</h2>
            <p className="mt-1 text-sm font-medium text-white/60">
              By Migoals · Train your mind like a Matilda
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-bold text-white">$29.99</span>
              <span className="text-lg text-white/40 line-through">$49.99</span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                40% OFF
              </span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-white/60">
              More than a notebook — a mindset training tool created with guidance from Chloe
              Logarzo and Emily Gielnik, built on the same principles elite players use at the
              highest level.
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {LEARN.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                  <IconCheck className="h-4 w-4 text-emerald-400" /> {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs text-white/40">
              Dispatched within 2 business days · Australia Post flat rate $14.95.
            </p>

            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
              >
                Buy the planner
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}