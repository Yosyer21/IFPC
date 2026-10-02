import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { IconArrowRight, IconCheck, IconUsers, IconWhistle } from '@/components/landing/icons';

export const metadata: Metadata = {
  title: 'Activities — Future Baller',
  description:
    'Inclusive football clinics, squad super sessions and mindset tools for girls aged 10–18.',
};

const ACTIVITIES = [
  {
    tag: 'Clinics',
    title: 'Inclusive Football Clinics',
    price: 'From $120 AUD',
    icon: IconWhistle,
    description:
      'Immersive 5-hour sessions focused on technical skills, tactical awareness, speed & agility and the mindset to succeed at any level.',
    points: [
      'Open to all abilities, ages 10–18',
      'Delivered by elite coaches and guest players',
      'Performance-focused content in small groups',
    ],
  },
  {
    tag: 'Squad',
    title: 'Future Baller Squad Super Session',
    price: 'Price on application',
    icon: IconUsers,
    description:
      'Exclusive training brought directly to your club or team — on-pitch focus with off-pitch leadership development.',
    points: [
      'On-pitch technical and tactical work',
      'Off-pitch leadership and mindset sessions',
      'Tailored to your squad and schedule',
    ],
  },
];

export default function ActivitiesPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Activities
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Train with Future Baller</h1>
          <p className="mt-4 max-w-2xl text-white/55">
            Experiences designed to elevate your journey — holistic sessions that develop the whole
            player, on and off the pitch.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {ACTIVITIES.map((activity) => (
            <article
              key={activity.title}
              className="rounded-2xl border border-white/10 bg-[#101512] p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 text-emerald-400">
                    <activity.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">
                      {activity.tag}
                    </span>
                    <h2 className="text-xl font-semibold text-white">{activity.title}</h2>
                  </div>
                </div>
                <span className="text-lg font-semibold text-white">{activity.price}</span>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-white/60">{activity.description}</p>

              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {activity.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-white/60">
                    <IconCheck className="h-4 w-4 text-emerald-400" /> {point}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Enquire now <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}