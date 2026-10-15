import Image from 'next/image';

const SHOTS = [
  {
    src: '/assets/player-dribbling.jpg',
    alt: 'A footballer driving forward with the ball',
  },
  {
    src: '/assets/player-celebration-night.jpg',
    alt: 'A footballer applauding the crowd after a night match',
  },
  {
    src: '/assets/player-portrait-stadium.jpg',
    alt: 'A footballer on the pitch with the crowd behind',
  },
];

export function Gallery() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-subtle">
            On the pitch
          </p>
          <h2 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">
            The game we love
          </h2>
          <p className="mt-4 text-lg text-subtle">
            Energy, teamwork and joy — from grassroots to the elite.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SHOTS.map((shot) => (
            <div
              key={shot.src}
              className="group relative h-64 overflow-hidden rounded-[2rem] border border-ink/10 sm:h-80"
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
