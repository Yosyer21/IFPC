import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = { title: 'Pathway — Future Baller' };

const STAGES: Record<string, { title: string; age: string; focus: string; goals: string[] }> = {
  base: {
    title: 'Youth level',
    age: '6–14 years',
    focus: 'Individual technique, coordination and training habits.',
    goals: [
      'Master ball control and first touch with both feet',
      'Develop dribbling with change of pace',
      'Build warm-up and recovery habits',
      'Play the first official tournament',
    ],
  },
  formacion: {
    title: 'Training',
    age: '14–17 years',
    focus: 'Tactics, physical and competition. First trials and showcases.',
    goals: [
      'Consolidate the tactical role in the position',
      'Raise the competitive level to national',
      'Take part in trial days',
      'Build a scouting profile with videos',
    ],
  },
  profesional: {
    title: 'Pre-professional',
    age: '17–21 years',
    focus: 'Performance, university scholarships and first contracts.',
    goals: [
      'Maintain a professional physical level',
      'Earn academic-sports scholarships',
      'Sign the first training contract',
      'Earn regular minutes in senior competition',
    ],
  },
  universitario: {
    title: 'Universitario / Pro',
    age: '18+ years',
    focus: 'Academic-sports scholarships or professional contracts.',
    goals: [
      'Combine studies and competitive football',
      'Represent the university in the national league',
      'Sign a professional contract if performance allows',
    ],
  },
};

export default function PathwayDetailPage({
  params,
}: {
  params: Promise<{ pathwayId: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <Link href="/pathways" className="text-sm text-muted-foreground hover:text-emerald-400">
          ← Development pathways
        </Link>

        <div className="mt-6">
          <PathwayContent params={params} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

async function PathwayContent({ params }: { params: Promise<{ pathwayId: string }> }) {
  const { pathwayId } = await params;
  const stage = STAGES[pathwayId];
  if (!stage) notFound();

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{stage.title}</h1>
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400">
          {stage.age}
        </span>
      </div>
      <p className="mt-3 text-muted-foreground">{stage.focus}</p>

      <h2 className="mb-4 mt-8 text-lg font-semibold">Stage goals</h2>
      <div className="flex flex-col gap-2">
        {stage.goals.map((goal) => (
          <div
            key={goal}
            className="flex items-start gap-3 rounded-xl border border-border/60 p-4 text-sm"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
              ✓
            </span>
            <span>{goal}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          The platform assigns goals, evaluations and opportunities for this stage to each player.
        </p>
        <Link
          href="/register"
          className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          Start my journey
        </Link>
      </div>
    </div>
  );
}


