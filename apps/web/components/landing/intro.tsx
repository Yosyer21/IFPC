'use client';

import { useEffect, useState } from 'react';
import { IconBall } from './icons';

export function Intro() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t1 = window.setTimeout(() => setPhase('out'), 1700);
    const t2 = window.setTimeout(() => {
      setPhase('done');
      document.body.style.overflow = '';
    }, 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.body.style.overflow = '';
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#050806] transition-opacity duration-700 ${
        phase === 'out' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <div className="animate-drift absolute h-72 w-72 rounded-full bg-emerald-500/25 blur-[120px]" />
      <div className="animate-drift-slow absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="animate-drift absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-violet-500/20 blur-[120px]" />

      <div className="relative flex flex-col items-center">
        <span className="animate-intro-up flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/30 bg-[#0a0e0c]/70">
          <IconBall className="animate-spin-slow h-10 w-10 text-emerald-400" />
        </span>
        <h1
          className="animate-intro-up mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl"
          style={{ animationDelay: '120ms' }}
        >
          Future<span className="text-gradient animate-gradient">Baller</span>
        </h1>
        <p
          className="animate-intro-up mt-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/45"
          style={{ animationDelay: '240ms' }}
        >
          Train · Grow · Believe
        </p>
        <div className="mt-7 h-1 w-44 overflow-hidden rounded-full bg-white/10">
          <div className="animate-intro-bar h-full origin-left rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-lime-400" />
        </div>
      </div>
    </div>
  );
}