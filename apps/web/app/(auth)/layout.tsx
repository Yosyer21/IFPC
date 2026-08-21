import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0e0c] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101512] p-8 shadow-xl shadow-black/20">
        {children}
      </div>
    </main>
  );
}
