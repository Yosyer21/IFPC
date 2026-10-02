import Image from 'next/image';

const SHOTS = [
  { src: '/images/football-02.jpg', alt: 'Footballers contesting the ball during a match', big: true },
  { src: '/images/football-03.jpg', alt: 'Match action on the pitch' },
  { src: '/images/football-04.jpg', alt: 'Players competing during a game' },
  { src: '/images/football-08.jpg', alt: 'Young footballers in play' },
  { src: '/images/football-07.jpg', alt: 'Players celebrating together' },
];

export function Gallery() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            On the pitch
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            The game we love
          </h2>
          <p className="mt-4 text-lg text-white/55">
            Energy, teamwork and joy — from grassroots to the elite.
          </p>
        </div>

        <div className="mt-14 grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-4">
          {SHOTS.map((shot) => (
            <div
              key={shot.src}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 ${
                shot.big ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e0c]/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-0 ring-1 ring-inset ring-emerald-400/0 transition-all duration-300 group-hover:ring-emerald-400/40" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}