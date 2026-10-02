import { IconStar } from './icons';

const FOUNDERS = [
  { name: 'Chloe Logarzo', role: 'Matildas midfielder · Ex-professional', initials: 'CL' },
  { name: 'Emily Gielnik', role: 'Matildas forward · Ex-professional', initials: 'EG' },
];

const VALUES = ['Technical skills', 'Mindset', 'Leadership', 'Resilience', 'Self-belief'];

export function Founders() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
              Led by Matildas
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              World-class experience, led by international players
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Future Buller is led by accomplished international players{' '}
              <strong className="text-white/80">Chloe Logarzo</strong> and{' '}
              <strong className="text-white/80">Emily Gielnik</strong>, who share their knowledge and
              expertise to equip young girls with holistic football skills and cultivate mental
              strength, resilience and leadership.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              Chloe and Emily attend <strong className="text-white/80">every camp</strong> — creating
              a belief on and off the field.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {VALUES.map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {FOUNDERS.map((founder) => (
              <div
                key={founder.name}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101512] p-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-base font-semibold text-emerald-400">
                  {founder.initials}
                </div>
                <div>
                  <p className="flex items-center gap-2 text-lg font-semibold text-white">
                    {founder.name}
                    <IconStar className="h-4 w-4 text-emerald-400" />
                  </p>
                  <p className="text-sm text-white/55">{founder.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}