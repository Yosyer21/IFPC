import { IconStar } from './icons';

const TESTIMONIALS = [
  {
    quote:
      'In three months I went from a regional club to a trial with a professional club. The profile and the match score made them look at me.',
    name: 'Carlos Fernández',
    role: 'Striker · 17 years old',
    initials: 'CF',
  },
  {
    quote:
      'We posted a youth trial and received over 300 applications filtered by position and age. Scouting now starts earlier.',
    name: 'Academia Pro Club',
    role: 'Youth team · Madrid',
    initials: 'AP',
  },
  {
    quote:
      'I follow every stage of my players: submission, trial, negotiation and contract. The whole process, transparent and in one place.',
    name: 'Álvaro Ruiz',
    role: 'FIFA Agent',
    initials: 'AR',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            Real stories
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            The future is already playing
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#101512] p-7"
            >
              <div>
                <div className="mb-4 flex items-center gap-1 text-emerald-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <IconStar key={index} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-white/70">
                  “{testimonial.quote}”
                </blockquote>
              </div>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white/80">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs text-white/45">{testimonial.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
