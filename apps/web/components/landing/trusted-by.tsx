const CLUBS = [
  'ACADEMIA PRO',
  'LALIGA TALENTS',
  'PREMIER SCOUTING',
  'MLS NEXT',
  'LIGA MX',
  'BUNDESLIGA ACADEMY',
];

export function TrustedBy() {
  return (
    <section className="border-y border-white/[0.06] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Trusted by leading clubs & academies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {CLUBS.map((club) => (
            <span
              key={club}
              className="text-sm font-semibold tracking-wide text-white/30 transition-colors hover:text-white/55"
            >
              {club}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
