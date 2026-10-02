'use client';

import { useState } from 'react';

export function Newsletter() {
  const [done, setDone] = useState(false);

  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-[#0e1310] px-6 py-16 text-center sm:px-16 sm:py-20">
          <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Become a <span className="text-emerald-400">Baller!</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/55">
            Sign up with your email address to receive news and updates.
          </p>

          {done ? (
            <p className="mx-auto mt-8 max-w-md rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
              Thanks! We&apos;ll be in touch.
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setDone(true);
              }}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                placeholder="you@email.com"
                aria-label="Email address"
                className="min-w-0 flex-1 rounded-md border border-white/15 bg-[#0a0e0c] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-emerald-500/50 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400"
              >
                Sign up
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}