import Image from 'next/image';
import Link from 'next/link';
import { IconArrowRight } from './icons';

const OFFERINGS = [
  {
    title: 'Inclusive Football Clinics',
    description:
      'Immersive 5-hour sessions focused on technical skills, tactical awareness, speed & agility and the mindset to succeed at any level. Open to all abilities, delivered by elite coaches, guest players and performance-focused content.',
    image: '/images/football-02.jpg',
  },
  {
    title: 'Super Sessions & Squad Experiences',
    description:
      'Exclusive training brought directly to your club or team — on-pitch focus with off-pitch leadership development.',
    image: '/images/football-04.jpg',
  },
  {
    title: 'Future Buller Planner',
    description:
      'A professional goal-setting journal inspired by the performance processes of elite players, to stay organised, intentional and focused all season long.',
    image: '/images/football-08.jpg',
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

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {OFFERINGS.map((item) => (
            <article
              key={item.title}
              className="card-hover group overflow-hidden rounded-2xl border border-white/10 bg-[#101512]"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101512] via-[#101512]/20 to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{item.description}</p>
                <Link
                  href="/activities"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Learn more <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}