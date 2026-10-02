import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Privacy — Future Baller',
  description: 'How Future Baller handles your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Privacy</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-white/60">
          <p>
            We collect only the information needed to run our programs and communicate with you —
            such as your name, email and, where relevant, a guardian&apos;s contact details for
            participants under 18.
          </p>
          <p>
            We use your information to manage bookings, send updates you have requested and improve
            our activities. We do not sell your personal information.
          </p>
          <p>
            For participants under 18, a parent or guardian is responsible for consent and for
            managing the account. To access, correct or delete your data, contact us at
            hello@futureballer.com.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}