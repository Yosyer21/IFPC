import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mist px-4 py-12 text-foreground">
      {/* Glows lima suaves del nuevo sistema visual */}
      <div
        className="animate-drift pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/20 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="animate-drift-slow pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand/10 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2.5"
          aria-label="Future Baller home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display text-sm leading-none text-ink">
            FB
          </span>
          <span className="font-display text-xl uppercase tracking-tight text-ink">
            Future <span className="text-[#4f6b0a]">Baller</span>
          </span>
        </Link>

        <div className="animate-fade-up rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © Future Baller · Connecting talent with opportunity
        </p>
      </div>
    </main>
  );
}

