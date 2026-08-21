import Link from 'next/link';
import { IconArrowRight } from './icons';

export function Cta() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-[#0e1310] px-6 py-16 text-center sm:px-16 sm:py-20">
          <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Your next opportunity{' '}
            <span className="text-emerald-400">is waiting</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/55">
            Join free and start building the profile clubs want to see.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-white px-7 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
            >
              Create my account <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-7 py-3 text-base font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
