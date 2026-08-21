const STATS = [
  { value: '12,000+', label: 'Registered players' },
  { value: '350+', label: 'Clubs & academies' },
  { value: '1,500+', label: 'Opportunities posted' },
  { value: '240+', label: 'Contracts signed' },
];

export function Stats() {
  return (
    <section className="border-y border-white/[0.06] bg-[#0e1310] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {stat.value}
              </div>
              <p className="mt-3 text-sm uppercase tracking-wider text-white/45">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
