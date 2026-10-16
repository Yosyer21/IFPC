import Image from 'next/image';
import { IconStar } from './icons';

const FOUNDERS: { name: string; role: string; initials: string; img?: string }[] = [
  {
    name: 'Chloe Logarzo',
    role: 'Matildas midfielder · Ex-professional',
    initials: 'CL',
    img: '/assets/player-of-the-match-trophy.jpg',
  },
  {
    name: 'Emily Gielnik',
    role: 'Matildas forward · Ex-professional',
    initials: 'EG',
    img: '/assets/founder-emily-gielnik.jpg',
  },
];

const VALUES = ['Technical skills', 'Mindset', 'Leadership', 'Resilience', 'Self-belief'];

export function Founders() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative">
            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-ink/10">
              <Image
                src="/assets/player-of-the-match-trophy.jpg"
                alt="Chloe Logarzo with the Player of the Match trophy at the 2019 World Cup"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>

            {/* Emily, en una tarjeta que se solapa con la foto de Chloe. */}
            <div className="absolute -bottom-6 -right-4 w-32 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl sm:-right-6 sm:w-44">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/assets/founder-emily-gielnik.jpg"
                  alt="Emily Gielnik, Matildas forward"
                  fill
                  sizes="(max-width: 640px) 128px, 176px"
                  className="object-cover object-top"
                />
              </div>
              <p className="px-2 py-1.5 text-center text-[10px] font-semibold text-ink">
                Emily Gielnik
              </p>
            </div>

            <div className="absolute -left-5 -top-5 hidden rounded-2xl border border-ink/10 bg-white px-6 py-4 shadow-xl sm:block">
              <p className="text-xs uppercase tracking-wider text-subtle">Attend every camp</p>
              <p className="mt-1 text-sm font-semibold text-ink">Chloe &amp; Emily</p>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-subtle">
              Led by Matildas
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              World-class experience, led by international players
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-subtle">
              Future Baller is led by accomplished international players{' '}
              <strong className="text-ink">Chloe Logarzo</strong> and{' '}
              <strong className="text-ink">Emily Gielnik</strong>, who share their knowledge and
              expertise to equip young girls with holistic football skills and cultivate mental
              strength, resilience and leadership.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {VALUES.map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-medium text-subtle"
                >
                  {value}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {FOUNDERS.map((founder) => (
                <div
                  key={founder.name}
                  className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4"
                >
                  {founder.img ? (
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-brand/60">
                      <Image
                        src={founder.img}
                        alt={founder.name}
                        fill
                        sizes="48px"
                        className="object-cover object-top"
                      />
                    </span>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand/60 bg-gradient-to-br from-brand/40 to-brand/20 text-sm font-semibold text-ink">
                      {founder.initials}
                    </div>
                  )}
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-ink">
                      {founder.name}
                      <IconStar className="h-3.5 w-3.5 text-subtle" />
                    </p>
                    <p className="text-xs text-subtle">{founder.role}</p>
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
