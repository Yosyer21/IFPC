import Image from 'next/image';
import Link from 'next/link';
import { IconArrowRight } from './icons';

const OFFERINGS = [
  {
    n: '01',
    accent: 'text-brand/60',
    title: 'Inclusive Football Clinics',
    text: 'Immersive 5-hour sessions focused on technical skills, tactical awareness, speed & agility and the mindset to succeed at any level. Open to all abilities and delivered by elite coaches and guest players.',
    image: '/assets/player-on-the-ball.jpg',
    alt: 'A footballer carrying the ball during a match',
  },
  {
    n: '02',
    accent: 'text-brand/60',
    title: 'Super Sessions & Squad Experiences',
    text: 'Exclusive training brought directly to your club or team — on-pitch focus with off-pitch leadership development, tailored to your squad and schedule.',
    image: '/assets/player-running.jpg',
    alt: 'A footballer running during a match',
  },
  {
    n: '03',
    accent: 'text-brand/60',
    title: 'Future Baller Planner',
    text: 'A professional goal-setting journal inspired by the performance processes of elite players, to stay organised, intentional and focused all season long.',
    image: '/assets/player-goal-roar.jpg',
    alt: 'A footballer celebrating a goal',
  },
];

export function Offerings() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-subtle">
            What we do
          </p>
          <h2 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Experiences that elevate your journey
          </h2>
        </div>

        <div className="mt-16 flex flex-col gap-16 sm:gap-24">
          {OFFERINGS.map((offer, index) => (
            <div key={offer.title} className="grid items-center gap-10 lg:grid-cols-2">
              <div
                className={`relative h-72 overflow-hidden rounded-[2rem] border border-ink/10 sm:h-[26rem] ${
                  index % 2 === 1 ? 'lg:order-last' : ''
                }`}
              >
                <Image
                  src={offer.image}
                  alt={offer.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
              </div>
              <div className="relative">
                <span
                  className={`block text-7xl font-black leading-none sm:text-8xl ${offer.accent}`}
                >
                  {offer.n}
                </span>
                <h3 className="-mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                  {offer.title}
                </h3>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-subtle">{offer.text}</p>
                <Link
                  href="/activities"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-ink underline decoration-brand decoration-2 underline-offset-4 transition-colors hover:decoration-4"
                >
                  Learn more <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
