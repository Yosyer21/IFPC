import Image from 'next/image';
import { IconStar } from './icons';

const FOUNDERS: { name: string; role: string; initials: string; img?: string }[] = [
  {
    name: 'Chloe Logarzo',
    role: 'Matildas midfielder · Ex-professional',
    initials: 'CL',
    img: '/images/chloe-logarzo.jpg',
  },
  { name: 'Emily Gielnik', role: 'Matildas forward · Ex-professional', initials: 'EG' },
];

const VALUES = ['Technical skills', 'Mindset', 'Leadership', 'Resilience', 'Self-belief'];

export function Founders() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative">
            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-white/10">
              <Image
                src="/images/chloe-logarzo.jpg"
                alt="Chloe Logarzo, Matildas midfielder, in the Australia kit"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e0c]/70 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 -right-5 hidden rounded-2xl border border-emerald-500/30 bg-[#0a0e0c] px-6 py-4 shadow-xl sm:block">
              <p className="text-xs uppercase tracking-wider text-emerald-400/80">Attend every camp</p>
              <p className="mt-1 text-sm font-semibold text-white">Chloe &amp; Emily</p>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
              Led by Matildas
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              World-class experience, led by international players
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Future Baller is led by accomplished international players{' '}
              <strong className="text-white/85">Chloe Logarzo</strong> and{' '}
              <strong className="text-white/85">Emily Gielnik</strong>, who share their knowledge and
              expertise to equip young girls with holistic football skills and cultivate mental
              strength, resilience and leadership.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {VALUES.map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60"
                >
                  {value}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {FOUNDERS.map((founder) => (
                <div
                  key={founder.name}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101512] p-4"
                >
                  {founder.img ? (
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-emerald-500/40">
                      <Image
                        src={founder.img}
                        alt={founder.name}
                        fill
                        sizes="48px"
                        className="object-cover object-top"
                      />
                    </span>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-lime-500/10 text-sm font-semibold text-emerald-400">
                      {founder.initials}
                    </div>
                  )}
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-white">
                      {founder.name}
                      <IconStar className="h-3.5 w-3.5 text-emerald-400" />
                    </p>
                    <p className="text-xs text-white/55">{founder.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}