export function Mission() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="bg-grid-faint pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="animate-drift absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/12 blur-[120px]" />
      <div className="animate-drift-slow absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-cyan-500/12 blur-[120px]" />
      <div className="animate-drift absolute -right-10 top-10 h-64 w-64 rounded-full bg-violet-500/12 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-emerald-400/80">
          Our mission
        </p>
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
          Where passion meets <span className="text-gradient">purpose</span>
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-white/65 sm:text-2xl">
          We empower girls aged 10–18 through holistic football development — combining technical
          training, mindset, leadership and personal growth.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/45">
          More than a clinic, Future Baller is a pathway — building confidence, resilience and
          self-belief through events, tools and a community that loves the game.
        </p>
      </div>
    </section>
  );
}