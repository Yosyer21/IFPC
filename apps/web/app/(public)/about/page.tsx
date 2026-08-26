import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'About — IFPC',
  description:
    'IFPC connects talent with opportunities: development, scouting and recruitment in one place.',
};

const VALUES = [
  {
    title: 'Talent first',
    description:
      'Every player has a unique profile. We help their level and potential be seen clearly.',
  },
  {
    title: 'Transparency',
    description:
      'Clubs, scouts and agents evaluate with real data: assessments, videos and metrics.',
  },
  {
    title: 'No borders',
    description:
      'From youth football to professional and collegiate. A player\u2019s future should not depend on their postcode.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">About</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Where talent finds its future
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            IFPC is a global football platform that connects players, families,
            coaches, clubs, agents, scouts and universities. Sports profile, development plan,
            trials, scholarships and contracts: the player\u2019s entire professional journey in a
            single ecosystem.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-border/60 bg-card p-6"
            >
              <h2 className="text-lg font-semibold text-emerald-400">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Are you a player or do you represent a club?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Create your profile and start receiving opportunities that match your level.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Create account
            </Link>
            <Link
              href="/opportunities"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              View opportunities
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


