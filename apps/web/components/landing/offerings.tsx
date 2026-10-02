import { IconBook, IconUsers, IconWhistle } from './icons';

const OFFERINGS = [
  {
    title: 'Inclusive Football Clinics',
    description:
      'Immersive 5-hour sessions focused on technical skills, tactical awareness, speed & agility and the mindset to succeed at any level. Open to all abilities, delivered by elite coaches, guest players and performance-focused content.',
    icon: IconWhistle,
  },
  {
    title: 'Super Sessions & Squad Experiences',
    description:
      'Exclusive training brought directly to your club or team — on-pitch focus with off-pitch leadership development.',
    icon: IconUsers,
  },
  {
    title: 'Future Buller Planner',
    description:
      'A professional goal-setting journal inspired by the performance processes of elite players, to stay organised, intentional and focused all season long.',
    icon: IconBook,
  },
];

export function Offerings() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            What we do
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Experiences that elevate your journey
          </h2>
          <p className="mt-4 text-lg text-white/55">
            A pathway that supports continuous development through events, tools and resources.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-3">
          {OFFERINGS.map((item) => (
            <div key={item.title} className="bg-[#0a0e0c] p-8 transition-colors hover:bg-[#101512]">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 text-emerald-400">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}