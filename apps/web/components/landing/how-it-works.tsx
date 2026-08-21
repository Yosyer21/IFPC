const STEPS = [
  {
    number: '01',
    title: 'Create your profile',
    description: 'Sign up free and complete your football, physical and contact details.',
  },
  {
    number: '02',
    title: 'Upload your videos',
    description: 'Show your game with highlights that scouts and clubs can watch.',
  },
  {
    number: '03',
    title: 'Find your opportunity',
    description: 'Get trials, scholarships and offers matched to your profile.',
  },
  {
    number: '04',
    title: 'Sign your future',
    description: 'Follow every step: submission, trial, negotiation and contract.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-white/[0.06] bg-[#0e1310] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From talent to contract in 4 steps
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative">
              {index < STEPS.length - 1 ? (
                <div
                  className="absolute left-1/2 top-5 hidden h-px w-full bg-white/10 lg:block"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 text-sm font-semibold text-emerald-400">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
