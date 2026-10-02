import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'About — Future Buller',
  description:
    'Future Buller is a holistic football development pathway for girls aged 10–18, led by Matildas Chloe Logarzo and Emily Gielnik.',
};

const VALUES = [
  {
    title: 'Holistic development',
    description:
      'Technical skills, mindset, leadership and personal growth — we develop the whole player, on and off the pitch.',
  },
  {
    title: 'Led by Matildas',
    description:
      'Chloe Logarzo and Emily Gielnik share the knowledge and habits of elite international football.',
  },
  {
    title: 'Open to all abilities',
    description:
      'Whether you are just starting out or chasing the next level, there is a place for you in the squad.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">About</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">The World of Future Buller</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Future Buller is dedicated to empowering girls aged 10–18 through holistic football
            development — combining technical training, mindset, leadership and personal growth so
            every player can perform their best both on and off the pitch.
          </p>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Founded and led by international players Chloe Logarzo and Emily Gielnik, our mission is
            to create a belief on and off the field — building confidence, resilience and
            self-belief through events, tools and resources.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="text-lg font-semibold text-emerald-400">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Ready to grow your game?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Explore our clinics and squad experiences, or join the next Train with a Matilda event.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/activities"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Explore activities
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


