import Link from 'next/link';
import {
  IconArrowRight,
  IconBriefcase,
  IconSearch,
  IconShield,
  IconUser,
  IconUsers,
  IconWhistle,
} from './icons';

const ROLES = [
  {
    role: 'PLAYER',
    title: 'Player',
    description: 'Your profile, your videos and the opportunities that fit you.',
    icon: IconUser,
  },
  {
    role: 'PARENT',
    title: 'Parent',
    description: 'Support and follow your child’s development every step of the way.',
    icon: IconUsers,
  },
  {
    role: 'COACH',
    title: 'Coach',
    description: 'Assess, guide and track your players’ progress.',
    icon: IconWhistle,
  },
  {
    role: 'SCOUT',
    title: 'Scout',
    description: 'Discover talent and build professional scouting reports.',
    icon: IconSearch,
  },
  {
    role: 'AGENT',
    title: 'Agent',
    description: 'Manage your players’ careers from start to finish.',
    icon: IconBriefcase,
  },
  {
    role: 'CLUB',
    title: 'Club',
    description: 'Post opportunities and find the player you need.',
    icon: IconShield,
  },
];

export function Roles() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            For everyone
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            One platform, six profiles
          </h2>
          <p className="mt-4 text-lg text-white/55">
            Built for every role in the football ecosystem.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((item) => (
            <Link
              key={item.role}
              href={`/register?role=${item.role}`}
              className="group bg-[#0a0e0c] p-8 transition-colors hover:bg-[#101512]"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 text-emerald-400">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                Get started <IconArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
