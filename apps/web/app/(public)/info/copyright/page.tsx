import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Copyright — Future Buller',
  description: 'Copyright notice for the Future Buller website and content.',
};

export default function CopyrightPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Copyright</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-white/60">
          <p>
            © {new Date().getFullYear()} Future Buller. All rights reserved. The Future Buller name,
            logo, program names and original content are protected.
          </p>
          <p>
            You may not reproduce, distribute or modify any part of this website or its content
            without written permission, except for personal, non-commercial use.
          </p>
          <p>Third-party names and marks belong to their respective owners.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}