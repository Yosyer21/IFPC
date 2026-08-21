import {
  IconRoute,
  IconSearch,
  IconShield,
  IconTarget,
  IconVideo,
  IconWhistle,
} from './icons';

const FEATURES = [
  {
    title: 'Scouting profile',
    description: 'A professional profile that highlights your stats, data and availability.',
    icon: IconSearch,
  },
  {
    title: 'Smart matching',
    description: 'A 0-100 score with per-criterion explanations: position, age, level and more.',
    icon: IconTarget,
  },
  {
    title: 'Full recruitment pipeline',
    description: 'A traceable flow: submission → trial → negotiation → contract.',
    icon: IconShield,
  },
  {
    title: 'Videos & highlights',
    description: 'Upload your best moments and make them visible to scouts and clubs.',
    icon: IconVideo,
  },
  {
    title: 'Guided training',
    description: 'Technical, strength and psychology content to keep growing.',
    icon: IconWhistle,
  },
  {
    title: 'Development pathways',
    description: 'Personalized plans with goals and progress evaluations.',
    icon: IconRoute,
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            Why Future Buller
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything modern football needs
          </h2>
          <p className="mt-4 text-lg text-white/55">
            Tools designed so talent doesn’t depend on luck alone.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-[#0a0e0c] p-8 transition-colors hover:bg-[#101512]">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 text-emerald-400">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
