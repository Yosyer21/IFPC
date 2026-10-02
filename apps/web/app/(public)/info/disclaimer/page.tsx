import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Disclaimer — Future Baller',
  description: 'Disclaimer for the Future Baller website and programs.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Disclaimer</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-white/60">
          <p>
            The information on this website is provided for general information about Future Baller
            programs, activities and products. It is not professional advice and should not be relied
            upon as such.
          </p>
          <p>
            Participation in football activities involves inherent risks. Future Baller works with
            qualified coaches to provide a safe environment, but each participant and their
            guardian are responsible for ensuring they are physically able to take part.
          </p>
          <p>
            Prices, dates, venues and availability may change. Delivered in association with partner
            venues and providers where indicated.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}