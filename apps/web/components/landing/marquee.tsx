import { IconBall } from './icons';

const WORDS = [
  'Inclusive football clinics',
  'Squad super sessions',
  'Mindset & leadership',
  'Elite coaching',
  'Matilda role models',
  'Train · Grow · Believe',
];

export function Marquee() {
  const items = [...WORDS, ...WORDS];
  return (
    <section className="border-y border-white/10 bg-[#0c110e] py-5">
      <div className="flex overflow-hidden">
        <div className="animate-marquee flex w-max shrink-0 items-center">
          {items.map((word, index) => (
            <span
              key={index}
              className="flex items-center gap-6 pr-6 text-sm font-bold uppercase tracking-[0.25em] text-white/40"
            >
              {word}
              <IconBall className="h-4 w-4 shrink-0 text-emerald-400/70" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}