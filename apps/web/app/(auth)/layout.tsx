import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b09] px-4 py-12">
      <div className="app-ambient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="bg-grid-faint pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="animate-drift pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-500/20 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="animate-drift-slow pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-[130px]"
        aria-hidden="true"
      />
      <div className="glass-card animate-fade-up relative w-full max-w-md rounded-3xl p-8 shadow-2xl">
        {children}
      </div>
    </main>
  );
}
