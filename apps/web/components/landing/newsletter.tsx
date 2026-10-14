'use client';

import { useState } from 'react';

export function Newsletter() {
  const [done, setDone] = useState(false);

  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-brand/25 bg-gradient-to-br from-brand/15 via-panel to-brand/10 px-6 py-16 text-center sm:px-16 sm:py-24">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/20 blur-[110px]" />
          <div
            className="bg-bars-faint-invert pointer-events-none absolute inset-0 opacity-50"
            aria-hidden="true"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Become a <span className="text-gradient">Baller!</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
              Sign up with your email to receive news, events and updates.
            </p>

            {done ? (
              <p className="mx-auto mt-9 max-w-md rounded-full border border-brand/40 bg-brand/15 px-5 py-3 text-sm font-semibold text-brand">
                Thanks! We&apos;ll be in touch.
              </p>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setDone(true);
                }}
                className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="min-w-0 flex-1 rounded-full border border-white/15 bg-ink/70 px-5 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-brand/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
                >
                  Sign up
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
