import Link from 'next/link';
import Image from 'next/image';
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
          <div className="group relative h-80 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/20 via-[#0c110e] to-lime-500/10 sm:h-[30rem]">
            <div className="absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[100px]" />
            <Image
              src="/images/planner.jpg"
              alt="Future Baller Planner by Migoals — a goal-setting journal for young footballers"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b09] via-[#070b09]/25 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-3 py-1 text-xs font-bold text-emerald-950">
              40% OFF
            </span>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-[#070b09]/70 backdrop-blur-sm">
                <IconBook className="h-5 w-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-base font-black text-white">Future Baller Planner</p>
                <p className="text-xs text-white/60">By Migoals</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-emerald-400/80">
              Mindset tool
            </p>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Train your mind like a Matilda
            </h2>

            <div className="mt-5 flex items-center gap-3">
              <span className="text-3xl font-black text-white">$29.99</span>
              <span className="text-lg text-white/40 line-through">$49.99</span>
              <span className="rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-3 py-1 text-xs font-bold text-emerald-950">
                40% OFF
              </span>
            </div>

            <p className="mt-6 text-lg leading-relaxed text-white/60">
              More than a notebook — a mindset training tool created with guidance from Chloe
              Logarzo and Emily Gielnik, built on the principles elite players use at the highest
              level.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {LEARN.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/65">
                  <IconCheck className="h-4 w-4 text-emerald-400" /> {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs text-white/40">
              Dispatched within 2 business days · Australia Post flat rate $14.95.
            </p>

            <div className="mt-8">
              <Link
                href="/products"
                className="glow inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-7 py-3.5 text-base font-bold text-emerald-950 transition-transform hover:scale-[1.03]"
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